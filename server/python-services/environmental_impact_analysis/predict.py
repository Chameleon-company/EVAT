import joblib
import pandas as pd

def load_model():
    """Loads the trained Gradient Boosting pipeline."""
    return joblib.load("co2_savings_model.pkl")

def predict_savings(input_dict: dict) -> dict:
    """
    Accepts a dictionary matching the API schema and returns predicted CO2 savings.
    
    Example input_dict:
    {
      "Make_EV": "Tesla",
      "Make_ICE": "Toyota",
      "BodyStyle_EV": "SUV",
      "BodyStyle_ICE": "SUV",
      "FuelType_ICE": "Petrol95",
      "YearDiff": 5,
      "ICE_CO2_Baseline": 220.4
    }
    """
    model = load_model()
    input_df = pd.DataFrame([input_dict])
    prediction = model.predict(input_df)[0]
    
    return {"Predicted_CO2_Savings": float(prediction)}

if __name__ == "__main__":
    # Quick sanity test when running the script directly
    sample_data = {
        "Make_EV": "Tesla",
        "Make_ICE": "Toyota",
        "BodyStyle_EV": "SUV",
        "BodyStyle_ICE": "SUV",
        "FuelType_ICE": "Petrol95",
        "YearDiff": 5,
        "ICE_CO2_Baseline": 220.4
    }
    print(predict_savings(sample_data))