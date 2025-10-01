import calendar
import os
import pandas as pd
import numpy as np
from fastapi import APIRouter, FastAPI, HTTPException
from typing import List, Dict, Any
from pydantic import BaseModel, Field
from service.ghg_emission_predictor import GHGEmissionPredictor
from datetime import date, timedelta
from service.scenario_data import ScenarioData


class Scenario(BaseModel):
    adjustments: Dict[str, float] = Field(
        ..., description="Map feature_name → percent change (e.g. {'co2_total': -0.1})"
    )
    forecast_year: int = Field(..., ge=1900, le=2100)


class SimulationResult(BaseModel):
    year: int
    predicted_day_of_year: int
    predicted_date: date
    raw_prediction: float
    baseline_day_of_year: int
    baseline_raw_prediction: float
    delta_days: int


split_router = APIRouter(prefix="/energy-split", tags=["Timeline"])


class YearRequest(BaseModel):
    year: int


class ScenarioApi:
    def __init__(self, app: FastAPI):
        self.predictor = GHGEmissionPredictor()
        self.scenario_data = ScenarioData().earth_vs_de_overshoot_df()
        self.model_directory = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data/models")
        self.predictor.load_models(self.model_directory)
        app.include_router(split_router)
        self.register_routes()

    def register_routes(self):
        def _predict_day_of_year(day_value: float, year: int):
            days_in_year = 366 if calendar.isleap(year) else 365
            raw = float(day_value)
            doy = int(np.clip(round(raw), 1, days_in_year))
            sim_date = date(year, 1, 1) + timedelta(days=doy - 1)
            return raw, doy, sim_date

        def _get_split_scalar(split_obj, feature_name: str):
            try:
                if isinstance(split_obj, pd.DataFrame) and feature_name in split_obj.columns:
                    return float(split_obj.iloc[0][feature_name])
                if isinstance(split_obj, pd.Series) and feature_name in split_obj.index:
                    return float(split_obj[feature_name])
                if isinstance(split_obj, dict):
                    val = split_obj.get(feature_name)
                    if val is not None:
                        return float(val)
            except Exception:
                return 0.0
            return 0.0

        def apply_adjustments(year, year_data, adjustments: Dict[str, float]):
            carbon_prv = float(year_data['Carbon'].item())
            split = self.predictor.predict_year(year) if year > 2024 else self.predictor.csv_f(year)
            new_carbon = carbon_prv + sum(
                carbon_prv * (_get_split_scalar(split, feat) / 100.0) * float(pct)
                for feat, pct in adjustments.items()
            )
            return float(year_data['Total'].item()) + (new_carbon - carbon_prv)

        @split_router.post(
            "/",
            tags=["EnergySplit"],
            summary="Predict energy split for a given year (flat)",
            response_model=List[Dict[str, Any]],
        )
        def get_percent_split(payload: YearRequest):
            predicted_percentages = self.predictor.predict_year(payload.year)
            return predicted_percentages.to_dict(orient="records") if hasattr(predicted_percentages, 'to_dict') else predicted_percentages

        @split_router.post(
            "/range",
            tags=["EnergySplit_range"],
            summary="Predict energy split range for a given year (flat)",
            response_model=List[Dict[str, Any]],
        )
        def get_percent_split_range(payload: YearRequest):
            predicted_split_range = self.predictor.get_prediction_range(payload.year)
            return predicted_split_range.to_dict(orient="records") if hasattr(predicted_split_range, 'to_dict') else predicted_split_range

        @split_router.get("/health")
        def health():
            return dict(
                status="ok",
                years_min=1990,
                years_max=2024,
                n_features=6,
                sparsity_threshold=0.25,
                clip_to_history=True,
            )

        @split_router.get("/features")
        def get_features():
            return self.predictor.get_features_name()

        @split_router.post("/simulate", response_model=List[SimulationResult])
        async def simulate(scenario: Scenario):
            df_year = self.scenario_data[self.scenario_data['year'] == scenario.forecast_year]
            if df_year.empty:
                raise HTTPException(status_code=404, detail=f"No data for year {scenario.forecast_year}")
            baseline_float = float(((df_year['World_bio_cap'] / df_year['Total']) * 365).iloc[0])
            base_raw, base_doy, _ = _predict_day_of_year(baseline_float, scenario.forecast_year)
            adjusted_total = apply_adjustments(scenario.forecast_year, df_year, scenario.adjustments)
            predicted_float = float((df_year['World_bio_cap'].iloc[0] / adjusted_total) * 365)
            raw, doy, sim_date = _predict_day_of_year(predicted_float, scenario.forecast_year)
            return [{
                "year": scenario.forecast_year,
                "predicted_day_of_year": doy,
                "predicted_date": sim_date,
                "raw_prediction": raw,
                "baseline_day_of_year": base_doy,
                "baseline_raw_prediction": base_raw,
                "delta_days": int(doy - base_doy),
            }]
