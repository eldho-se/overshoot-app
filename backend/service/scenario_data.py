import os
import pandas as pd
from datetime import datetime
import logging

GERMANY_EARTH_OVERSHOOT_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "DE_CountryOvershootDay.csv")
GERMANY_OS_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", 'Ecological_DE_full.csv')

class ScenarioData:
    def __init__(self):
        try:
            self.earth_de_df = pd.read_csv(GERMANY_EARTH_OVERSHOOT_PATH)
        except Exception as e:
            logging.error(f"Error loading {GERMANY_EARTH_OVERSHOOT_PATH}: {e}")
            self.earth_de_df = pd.DataFrame()
        try:
            self.de_full_df = pd.read_csv(GERMANY_OS_PATH)
        except Exception as e:
            logging.error(f"Error loading {GERMANY_OS_PATH}: {e}")
            self.de_full_df = pd.DataFrame()

    def earth_vs_de_overshoot_json(self):
        earth_carbon = self._get_earth_carbon()
        return earth_carbon.to_dict(orient="records")

    def earth_vs_de_overshoot_df(self):
        earth_carbon = self._get_earth_carbon()
        logging.info(f"Earth vs DE overshoot DataFrame:\n{earth_carbon}")
        return earth_carbon

    def _get_earth_carbon(self):
        if self.de_full_df.empty or self.earth_de_df.empty:
            logging.warning("One or both required DataFrames are empty.")
            return pd.DataFrame()
        earth_carbon = self.de_full_df.iloc[1::2].copy()
        earth_carbon['World_bio_cap'] = self.earth_de_df['Earth_biocapacity'].values[:len(earth_carbon)]
        return earth_carbon



