import pandas as pd
import os
from dataclasses import dataclass
from typing import List
import logging

@dataclass
class OvershootDataLoader:
    def __init__(self):
        self.germany_path = os.path.join(os.path.dirname(__file__), '../data/countries/Countries/Germany.csv')
        self.world_path = os.path.join(os.path.dirname(__file__), '../data/countries/Continents/World.csv')
        self.germany_df = self._load_data(self.germany_path)
        self.world_df = self._load_data(self.world_path)

    def _load_data(self, path):
        try:
            return pd.read_csv(path)
        except Exception as e:
            logging.error(f"Error loading {path}: {e}")
            return None

    def calculate_overshoot_days(self):
        if self.germany_df is None or self.world_df is None:
            return []
        germany_ef = self.germany_df[self.germany_df['record'] == 'EFConsPerCap'][['year', 'total']]
        world_biocap = self.world_df[self.world_df['record'] == 'BiocapPerCap'][['year', 'total']]
        merged = pd.merge(germany_ef, world_biocap, on='year', suffixes=('_germany_ef', '_world_biocap')).tail(5)
        merged['overshoot_day'] = (merged['total_world_biocap'] / merged['total_germany_ef']) * 365
        return [
            OvershootDayResult(
                year=int(row['year']),
                world_biocap=float(row['total_world_biocap']),
                germany_ef=float(row['total_germany_ef']),
                overshoot_day=float(row['overshoot_day'])
            )
            for _, row in merged.iterrows()
        ]


@dataclass
class OvershootDayResult:
    year: int
    world_biocap: float
    germany_ef: float
    overshoot_day: float

class OvershootForecastCalculator:
    def __init__(self):
        self.world_biocap_path = os.path.join(os.path.dirname(__file__), '../data/forcast/predicted_biocap_2025_2035.csv')
        self.germany_ef_path = os.path.join(os.path.dirname(__file__), '../data/forcast/predicted_germany_efcons_2024_2035.csv')
        self.world_biocap_df = self._load_and_prepare(self.world_biocap_path)
        self.germany_ef_df = self._load_and_prepare(self.germany_ef_path)

    def _load_and_prepare(self, path):
        try:
            df = pd.read_csv(path)
            df['year'] = pd.to_datetime(df['ds']).dt.year
            return df[['year', 'yhat']]
        except Exception as e:
            logging.error(f"Error loading {path}: {e}")
            return None

    def calculate_overshoot_days(self) -> List[OvershootDayResult]:
        if self.world_biocap_df is None or self.germany_ef_df is None:
            return []
        merged = pd.merge(self.world_biocap_df, self.germany_ef_df, on='year', suffixes=('_world_biocap', '_germany_ef'))
        merged['overshoot_day'] = (merged['yhat_world_biocap'] / merged['yhat_germany_ef']) * 365
        return [
            OvershootDayResult(
                year=int(row['year']),
                world_biocap=float(row['yhat_world_biocap']),
                germany_ef=float(row['yhat_germany_ef']),
                overshoot_day=float(row['overshoot_day'])
            )
            for _, row in merged.iterrows()
        ]

if __name__ == "__main__":
    loader = OvershootDataLoader()
    print(loader.calculate_overshoot_days())
    forecast_calc = OvershootForecastCalculator()
    print(forecast_calc.calculate_overshoot_days())



