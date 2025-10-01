import os
from fastapi import APIRouter, FastAPI
from pydantic import BaseModel
from typing import List
from service.overshoot_forcast import OvershootForecastCalculator, OvershootDataLoader
import pandas as pd

forcast_router = APIRouter(prefix="/forcast", tags=["Forcast"])


class OvershootDayAPIResponse(BaseModel):
    year: int
    world_biocap: float
    germany_ef: float
    overshoot_day: float
    is_predicted: bool


class ForcastApi:
    def __init__(self, app: FastAPI):
        app.include_router(forcast_router)
        self.register_routes()

    def register_routes(self):
        @forcast_router.get("/", response_model=List[OvershootDayAPIResponse])
        async def get_overshoot_forcast():
            og_results = OvershootDataLoader().calculate_overshoot_days()
            forecast_results = OvershootForecastCalculator().calculate_overshoot_days()
            predicted_years = set(range(2025, 2035))
            if og_results is None:
                og_results = []
            if forecast_results is None:
                forecast_results = []
            api_results = [
                OvershootDayAPIResponse(
                    year=og_r.year,
                    world_biocap=og_r.world_biocap,
                    germany_ef=og_r.germany_ef,
                    overshoot_day=og_r.overshoot_day,
                    is_predicted=False
                ) for og_r in og_results
            ]
            api_results += [
                OvershootDayAPIResponse(
                    year=r.year,
                    world_biocap=r.world_biocap,
                    germany_ef=r.germany_ef,
                    overshoot_day=r.overshoot_day,
                    is_predicted=True
                ) for r in forecast_results if r.year in predicted_years
            ]
            return api_results

        @forcast_router.get("/all_e")
        async def get_all_emissions():
            csv_path = os.path.join(os.path.dirname(__file__), '../data/forcast/Forecast_data.csv')
            try:
                df = pd.read_csv(csv_path).dropna()
                return df.to_dict(orient="records")
            except Exception as e:
                return [{"error": str(e)}]
