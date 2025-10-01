import pandas as pd
import joblib
import os


class GHGEmissionPredictor:
    def __init__(self):
        self.models = None
        csv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data/ghg_emission_pivoted.csv")
        try:
            self.loaded_csv = pd.read_csv(csv_path)
        except FileNotFoundError:
            print(f"CSV file not found at {csv_path}.")
            self.loaded_csv = pd.DataFrame()
        except Exception as e:
            print(f"Error loading CSV file: {e}")
            self.loaded_csv = pd.DataFrame()


    def csv_f(self, year):
        if self.loaded_csv.empty:
            print("Warning: Emissions CSV is not loaded.")
            return pd.DataFrame()
        filtered = self.loaded_csv[self.loaded_csv['Year'] == year]
        if filtered.empty:
            print(f"Warning: No data found for year {year}.")
        return filtered

    def load_models(self, model_dir_path):
        self.models = {}
        model_files = [f for f in os.listdir(model_dir_path)]
    # print(model_files)  # Removed terminal output
        for model_file in model_files:
            model_path = os.path.join(model_dir_path, model_file)
            # print(model_path)  # Removed terminal output
            try:
                model = joblib.load(model_path)
            except Exception as e:
                print(f"Error loading model from {model_path}: {e}")
                continue
            sector_name = model_file.replace('_prophet_model.joblib', '').replace('_', ' ')
            self.models[sector_name] = model
        # if self.models:
        #     print(f"Successfully loaded {len(self.models)} Prophet models from {model_dir_path}")
        # else:
        #     print(f"No Prophet models found in {model_dir_path}")

    def predict_year(self, year):
        if not self.models:
            raise ValueError("Models have not been loaded. Please call load_models first.")
        predictions_list = []
        future_df = pd.DataFrame({'ds': [pd.to_datetime(f'{year}-01-01')]})
        for sector, model in self.models.items():
            forecast = model.predict(future_df)
            predicted_percentage = forecast['yhat'].iloc[0]
            predictions_list.append({'Sector': sector, 'Predicted_Percentage': predicted_percentage})
        predictions_df = pd.DataFrame(predictions_list)
        yearly_predicted_sum = predictions_df['Predicted_Percentage'].sum()
        if yearly_predicted_sum != 0:
             predictions_df['Predicted_Percentage_Normalized'] = (predictions_df['Predicted_Percentage'] / yearly_predicted_sum) * 100
        else:
             predictions_df['Predicted_Percentage_Normalized'] = 0
        return predictions_df[['Sector', 'Predicted_Percentage_Normalized']]

    def get_prediction_range(self, year):
        if not self.models:
            raise ValueError("Models have not been loaded. Please call load_models first.")
        future_df = pd.DataFrame({'ds': [pd.to_datetime(f'{year}-01-01')]})
        prediction_ranges = []
        for sector, model in self.models.items():
            forecast = model.predict(future_df)
            lower_bound = forecast['yhat_lower'].iloc[0]
            upper_bound = forecast['yhat_upper'].iloc[0]
            prediction_ranges.append({
                'Sector': sector,
                'Year': year,
                'Lower_Bound': lower_bound,
                'Upper_Bound': upper_bound
            })
        prediction_ranges_df = pd.DataFrame(prediction_ranges)
        return prediction_ranges_df

    def get_features_name(self):
        all_columns=self.loaded_csv.columns.tolist()
        features = [col for col in all_columns if col.lower() != "year"]
        return features