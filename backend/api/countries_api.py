import json
import os
from typing import Optional

import numpy as np
import pandas as pd
from fastapi import APIRouter, FastAPI, HTTPException
from pydantic import BaseModel

country_router = APIRouter(prefix="/country", tags=["Data of Countries"])


class YearRequest(BaseModel):
    year: int


def _load_unique_countries():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    unique_countries_path = os.path.join(base_dir, "data", "unique_countries_grouped.json")
    try:
        with open(unique_countries_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, dict):
                return data
            elif isinstance(data, list):
                return {"Countries": data}
            else:
                return {"Countries": []}
    except Exception as e:
        print(f"Error loading unique countries: {e}")
        return {"Countries": []}


class CountryApi:
    def __init__(self, app: FastAPI):
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.countries_directory = os.path.join(base_dir, "data", "countries", "Countries")
        self.unique_countries = _load_unique_countries()
        app.include_router(country_router)
        self.register_routes()

    def register_routes(self):

        @country_router.get("/ct/{country_code}")
        @country_router.get("/ct/{country_code}/{record}")
        @country_router.get("/ct/{country_code}/{record}/{year}")
        @country_router.get("/ct/{country_code}/{year}")
        async def get_country_data(
            country_code: str,
            record: Optional[str] = None,
            year: Optional[int] = None
        ):
            def safe_country_filename(name: str) -> str:
                return name.replace(" ", "_").replace("/", "_")

            found_country = None
            for countries in self.unique_countries.get("Countries", []):
                if str(countries.get("countryCode")) == str(country_code):
                    found_country = countries
                    break

            if not found_country:
                raise HTTPException(
                    status_code=404,
                    detail=f"Country with code {country_code} not found."
                )

            country_name = found_country.get("countryName")
            safe_country_name = safe_country_filename(country_name)
            country_file_path = os.path.join(self.countries_directory, f"{safe_country_name}.csv")

            if not os.path.exists(country_file_path):
                raise HTTPException(
                    status_code=404,
                    detail=f"Data file for {country_name} ({country_code}) not found."
                )

            try:
                country_df = pd.read_csv(country_file_path)

                # Get available years from the data
                available_years = []
                if "year" in country_df.columns:
                    available_years = sorted(country_df["year"].dropna().unique().tolist())

                # Filter by record if provided
                if record is not None:
                    if "record" not in country_df.columns:
                        raise HTTPException(
                            status_code=404,
                            detail=f"No 'record' column in data for {country_name}."
                        )
                    country_df = country_df[country_df["record"] == record]
                    if country_df.empty:
                        raise HTTPException(
                            status_code=404,
                            detail=f"No data for {country_name} with record {record}."
                        )

                # Filter by year if provided
                if year is not None:
                    if "year" not in country_df.columns:
                        raise HTTPException(
                            status_code=404,
                            detail=f"No 'year' column in data for {country_name}."
                        )
                    country_df = country_df[country_df["year"] == int(year)]
                    if country_df.empty:
                        raise HTTPException(
                            status_code=404,
                            detail=f"No data for {country_name} in {year}."
                        )

                # Clean: drop any rows with NaN or inf values
                country_df = country_df.replace([np.inf, -np.inf], np.nan).dropna()

                # If no data after cleaning, return 404
                if country_df.empty:
                    raise HTTPException(
                        status_code=404,
                        detail=f"No valid data for {country_name} after cleaning."
                    )

                # Round numeric columns (total, value) to 2 decimals if present
                for col in ["total", "value"]:
                    if col in country_df.columns:
                        country_df[col] = country_df[col].apply(lambda x: round(x, 2) if pd.notna(x) else x)

                # If called with /ct/{country_code}/{year}, return availableYears in the response
                if year is not None and record is None:
                    data_records = country_df.to_dict(orient="records")
                    for rec in data_records:
                        rec["availableYears"] = available_years
                    return data_records

                return country_df.to_dict(orient="records")

            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Error reading data for {country_name}: {str(e)}"
                )

        @country_router.get("/country_list")
        async def get_country_list():
            return self.unique_countries.get("Countries", [])

        @country_router.get("/all/{year}")
        async def get_all_countries_data(year: int, record: Optional[str] = None):
            results = []

            # Loop through all CSVs in the directory
            for filename in os.listdir(self.countries_directory):
                if not filename.endswith(".csv"):
                    continue

                # Skip World.csv explicitly
                if filename.lower().startswith("world"):
                    continue

                file_path = os.path.join(self.countries_directory, filename)

                try:
                    df = pd.read_csv(file_path)

                    # Apply filters
                    if record:
                        filtered = df[(df["year"] == year) & (df["record"] == record)]
                    else:
                        filtered = df[df["year"] == year]

                    if not filtered.empty:
                        # Extract country name from file name
                        country_name = filename.replace(".csv", "").replace("_", " ")

                        for _, row in filtered.iterrows():
                            val = row.get("total", row.get("value", None))
                            if pd.isna(val) or np.isinf(val):
                                continue
                            total_val = float(row["total"]) if "total" in row else float(row["value"])
                            results.append({
                                "year": int(row["year"]),
                                "countryName": country_name,
                                "record": row["record"],
                                "countryCode": row["countryCode"],
                                "total": round(total_val, 2)
                            })

                except Exception as e:
                    # Skip problematic files but log the error
                    print(f"Error reading {file_path}: {e}")
                    continue

            if not results:
                raise HTTPException(
                    status_code=404,
                    detail=f"No data found for year {year}" + (f" and record {record}" if record else "") + "."
                )

            return results
