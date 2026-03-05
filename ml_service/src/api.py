import json
from pathlib import Path
from typing import List, Optional

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os


PROJECT_ROOT = Path(__file__).resolve().parents[2]
ML_ROOT = PROJECT_ROOT / "ml_service"
DATA_DIR = ML_ROOT / "data"
MODELS_DIR = ML_ROOT / "models"

DATASET_PATH = DATA_DIR / "kc_house_data.csv"


class ListingInput(BaseModel):
    bedrooms: int
    bathrooms: float
    sqft_living: int
    sqft_lot: int
    floors: float
    zipcode: int
    yr_built: int
    listed_price: Optional[float] = None


def load_artifacts():
    if not DATASET_PATH.is_file():
        raise RuntimeError(f"Dataset not found at {DATASET_PATH}")

    df = pd.read_csv(DATASET_PATH)

    features_path = MODELS_DIR / "features.json"
    model_path = MODELS_DIR / "price_model.joblib"
    scaler_path = MODELS_DIR / "scaler.joblib"
    knn_path = MODELS_DIR / "knn_model.joblib"

    if not (
        features_path.is_file()
        and model_path.is_file()
        and scaler_path.is_file()
        and knn_path.is_file()
    ):
        raise RuntimeError("Model artifacts are missing. Run the training script first.")

    with features_path.open("r", encoding="utf-8") as f:
        features: List[str] = json.load(f)

    rf = joblib.load(model_path)
    scaler = joblib.load(scaler_path)
    knn = joblib.load(knn_path)

    # Keep only the columns we need (and drop rows with missing)
    feature_df = df[features + ["price"]].dropna()

    X_all = feature_df[features]
    y_all = feature_df["price"]

    return rf, scaler, knn, features, feature_df, X_all, y_all


app = FastAPI(title="AI Real Estate ML Service")

rf_model, scaler_model, knn_model, feature_order, feature_df, X_all, y_all = load_artifacts()
DEBUG_COMPS = os.environ.get("DEBUG_COMPS", "").lower() == "true"


def make_feature_vector(payload: ListingInput) -> np.ndarray:
    data = {
        "bedrooms": payload.bedrooms,
        "bathrooms": payload.bathrooms,
        "sqft_living": payload.sqft_living,
        "sqft_lot": payload.sqft_lot,
        "floors": payload.floors,
        "zipcode": payload.zipcode,
        "yr_built": payload.yr_built,
    }
    return np.array([[data[name] for name in feature_order]], dtype=float)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict")
def predict_price(payload: ListingInput):
    try:
        X = make_feature_vector(payload)
        pred = float(rf_model.predict(X)[0])
        return {"predicted_price": pred}
    except Exception as exc:  # pragma: no cover - defensive
        raise HTTPException(status_code=500, detail=f"Prediction error: {exc}")


@app.post("/comparables")
def comparables(payload: ListingInput):
    try:
        X = make_feature_vector(payload)
        X_scaled = scaler_model.transform(X)
        distances, indices = knn_model.kneighbors(X_scaled)
        idxs = indices[0]
        comps = []
        for idx in idxs:
            row = feature_df.iloc[int(idx)]
            comp = {
                "price": float(row["price"]),
                "bedrooms": int(row["bedrooms"]),
                "bathrooms": float(row["bathrooms"]),
                "sqft_living": int(row["sqft_living"]),
                "sqft_lot": int(row["sqft_lot"]),
                "floors": float(row["floors"]),
                "zipcode": int(row["zipcode"]),
                "yr_built": int(row["yr_built"]),
            }
            comps.append(comp)

        response = {"comparables": comps}
        if DEBUG_COMPS:
          response["debug"] = {
            "indices": [int(i) for i in idxs],
            "prices": [float(feature_df.iloc[int(i)]["price"]) for i in idxs],
          }
        return response
    except Exception as exc:  # pragma: no cover - defensive
        raise HTTPException(status_code=500, detail=f"Comparables error: {exc}")


@app.post("/analyze")
def analyze(payload: ListingInput):
    try:
        X = make_feature_vector(payload)
        pred = float(rf_model.predict(X)[0])

        X_scaled = scaler_model.transform(X)
        distances, indices = knn_model.kneighbors(X_scaled)
        idxs = indices[0]
        comp_prices = [float(feature_df.iloc[int(i)]["price"]) for i in idxs]
        comps_avg_price = float(np.mean(comp_prices)) if comp_prices else pred

        listed_price = payload.listed_price if payload.listed_price is not None else comps_avg_price

        if pred != 0:
            deviation_pct = float((listed_price - pred) / pred * 100.0)
        else:
            deviation_pct = 0.0

        if abs(deviation_pct) <= 5:
            pricing_flag = "fair"
        elif deviation_pct > 5:
            pricing_flag = "overpriced"
        else:
            pricing_flag = "underpriced"

        response = {
            "predicted_price": pred,
            "comps_avg_price": comps_avg_price,
            "listed_price": float(listed_price),
            "deviation_pct": deviation_pct,
            "pricing_flag": pricing_flag,
        }

        if DEBUG_COMPS:
          response["debug"] = {
            "indices": [int(i) for i in idxs],
            "prices": comp_prices,
          }

        return response
    except Exception as exc:  # pragma: no cover - defensive
        raise HTTPException(status_code=500, detail=f"Analyze error: {exc}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("src.api:app", host="127.0.0.1", port=8000, reload=True)

