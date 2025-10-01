import pandas as pd
import os
from fastapi import FastAPI, APIRouter, Query, HTTPException

pie_router = APIRouter(prefix="/pie_data", tags=["Pie Chart Data"])


class PieChartApi:
    def __init__(self, app: FastAPI):
        app.include_router(pie_router)
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        energy_path = os.path.join(base_dir, "data", "energy_consumption_sector_pie.csv")
        co2_path = os.path.join(base_dir, "data", "co2_emmisoin_sector_pie.csv")
        self.energy_data: pd.DataFrame = pd.read_csv(energy_path)
        self.co2_emi: pd.DataFrame = pd.read_csv(co2_path)
        self.register_routes()

    def register_routes(self):
        @pie_router.get(
            "/energy",
            tags=["Energy"],
            summary="Get energy consumption data",
            response_description="Pie + drilldown formatted energy consumption data for the given year.",
        )
        def energy_data_pie(year: int = Query(2024, description="Year for energy data")):
            df = self.energy_data
            df = df[df["Year"] == year]
            if df.empty:
                raise HTTPException(status_code=404, detail=f"No energy data found for year {year}")
            try:
                sector_totals = df.groupby("Sector")["PJ"].sum().reset_index()
                pie_data = []
                for _, row in sector_totals.iterrows():
                    sector = row["Sector"]
                    value = row["PJ"]
                    pie_data.append({
                        "name": sector,
                        "y": value,
                        "drilldown": sector.lower().replace(" ", "_")
                    })
                energy_series = [{
                    "type": "pie",
                    "name": "Energy Consumption",
                    "data": pie_data
                }]
                drilldown_series = []
                for sector, group in df.groupby("Sector"):
                    drilldown_series.append({
                        "type": "column",
                        "name": sector,
                        "id": str(sector).lower().replace(" ", "_"),
                        "data": [
                            [row["Energy_source"], row["PJ"]] for _, row in group.iterrows()
                        ]
                    })
                energy_drilldown = {"series": drilldown_series}
                return {
                    "energySeries": energy_series,
                    "energyDrilldown": energy_drilldown
                }
            except Exception as e:
                import traceback
                traceback.print_exc()
                raise HTTPException(status_code=500, detail=f"An internal server error occurred: {str(e)}")

        @pie_router.get(
            "/co2",
            tags=["CO2"],
            summary="Get CO₂ emissions data for a given year",
            response_description="Pie and drilldown data for CO₂ emissions."
        )
        def co2_data(year: int = Query(1990, description="Year for CO₂ data")):
            df = self.co2_emi
            year_df = df[df["Year"] == year]
            if year_df.empty:
                raise HTTPException(status_code=404, detail=f"No CO₂ emissions data found for year {year}")
            try:
                sector_totals = (
                    year_df.groupby("Sector")["CO2_kt"].sum().reset_index()
                )
                pie_data = [
                    {
                        "name": row["Sector"],
                        "y": float(round(row["CO2_kt"], 2)),
                        "drilldown": row["Sector"].lower()
                    }
                    for _, row in sector_totals.iterrows()
                ]
                co2Series = [
                    {
                        "type": "pie",
                        "name": "CO₂ Emissions",
                        "data": pie_data
                    }
                ]
                drilldown_series = []
                for sector in sector_totals["Sector"]:
                    subsector_df = year_df[year_df["Sector"] == sector]
                    data = [
                        [row["Subsector_EN"], float(round(row["CO2_kt"], 2))]
                        for _, row in subsector_df.iterrows()
                    ]
                    drilldown_series.append(
                        {
                            "type": "column",
                            "name": sector,
                            "id": sector.lower(),
                            "data": data
                        }
                    )
                co2Drilldown = {"series": drilldown_series}
                return {"co2Series": co2Series, "co2Drilldown": co2Drilldown}
            except Exception as e:
                import traceback
                traceback.print_exc()
                raise HTTPException(status_code=500, detail=f"An internal server error occurred: {str(e)}")

        @pie_router.get(
            "/all",
            tags=["Combined"],
            summary="Get combined energy consumption and CO₂ emissions data (all years)",
            response_description="Returns both energy and CO₂ data for all years, aggregated by year and sector."
        )
        def all_data():
            try:
                # --- Energy Data ---
                df_energy = self.energy_data
                sector_totals_energy = df_energy.groupby(["Year", "Sector"])["PJ"].sum().reset_index()
                pie_energy = [
                    {
                        "year": int(row["Year"]),
                        "name": row["Sector"],
                        "y": float(row["PJ"])
                    }
                    for _, row in sector_totals_energy.iterrows()
                ]
                df_co2 = self.co2_emi
                sector_totals_co2 = df_co2.groupby(["Year", "Sector"])["CO2_kt"].sum().reset_index()
                pie_co2 = [
                    {
                        "year": int(row["Year"]),
                        "name": row["Sector"],
                        "y": float(round(row["CO2_kt"], 2))
                    }
                    for _, row in sector_totals_co2.iterrows()
                ]
                return {
                    "energy": {"energySeries": pie_energy},
                    "co2": {"co2Series": pie_co2}
                }
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"An internal server error occurred: {str(e)}"
                )
