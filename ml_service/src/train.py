import json
import math
from pathlib import Path

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.model_selection import train_test_split
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import StandardScaler


PROJECT_ROOT = Path(__file__).resolve().parents[2]
ML_ROOT = PROJECT_ROOT / "ml_service"
DATA_DIR = ML_ROOT / "data"
MODELS_DIR = ML_ROOT / "models"
DEMO_ARTIFACTS_DIR = PROJECT_ROOT / "demo_artifacts"
PLOTS_DIR = DEMO_ARTIFACTS_DIR / "plots"
SAMPLE_OUTPUTS_DIR = DEMO_ARTIFACTS_DIR / "sample_outputs"

LOCAL_DATASET = DATA_DIR / "kc_house_data.csv"

FEATURES = [
    "bedrooms",
    "bathrooms",
    "sqft_living",
    "sqft_lot",
    "floors",
    "zipcode",
    "yr_built",
]
TARGET = "price"


def ensure_directories() -> None:
    for path in [DATA_DIR, MODELS_DIR, DEMO_ARTIFACTS_DIR, PLOTS_DIR, SAMPLE_OUTPUTS_DIR]:
        path.mkdir(parents=True, exist_ok=True)


def ensure_dataset() -> Path:
    if LOCAL_DATASET.is_file():
        return LOCAL_DATASET
    raise FileNotFoundError(
        "Could not find kc_house_data.csv in the ML service data folder.\n"
        f"Expected path: {LOCAL_DATASET}\n\n"
        "Please place the King County housing dataset file at this location:\n"
        "  ml_service/data/kc_house_data.csv\n"
    )


def train_models(df: pd.DataFrame):
    df = df.copy()
    df = df.dropna(subset=FEATURES + [TARGET])

    X = df[FEATURES]
    y = df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    rf = RandomForestRegressor(
        n_estimators=200, random_state=42, n_jobs=-1
    )
    rf.fit(X_train, y_train)

    y_pred = rf.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = math.sqrt(mean_squared_error(y_test, y_pred))

    print(f"MAE: {mae:,.2f}")
    print(f"RMSE: {rmse:,.2f}")

    # Nearest neighbors on scaled features (for comparables)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    knn = NearestNeighbors(n_neighbors=5)
    knn.fit(X_scaled)

    return rf, scaler, knn, X, y, X_test, y_test, y_pred, mae, rmse


def save_models(rf, scaler, knn):
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(rf, MODELS_DIR / "price_model.joblib")
    joblib.dump(scaler, MODELS_DIR / "scaler.joblib")
    joblib.dump(knn, MODELS_DIR / "knn_model.joblib")

    with (MODELS_DIR / "features.json").open("w", encoding="utf-8") as f:
        json.dump(FEATURES, f)


def make_plots(y_test, y_pred, rf):
    PLOTS_DIR.mkdir(parents=True, exist_ok=True)

    # Actual vs predicted
    plt.figure()
    plt.scatter(y_test, y_pred)
    min_val = min(y_test.min(), y_pred.min())
    max_val = max(y_test.max(), y_pred.max())
    plt.plot([min_val, max_val], [min_val, max_val])
    plt.xlabel("Actual Price")
    plt.ylabel("Predicted Price")
    plt.title("Actual vs Predicted Prices")
    plt.tight_layout()
    plt.savefig(PLOTS_DIR / "actual_vs_pred.png")
    plt.close()

    # Feature importance
    importances = rf.feature_importances_
    indices = np.argsort(importances)[::-1]
    sorted_features = [FEATURES[i] for i in indices]
    sorted_importances = importances[indices]

    plt.figure()
    plt.bar(range(len(sorted_features)), sorted_importances)
    plt.xticks(range(len(sorted_features)), sorted_features, rotation=45, ha="right")
    plt.ylabel("Importance")
    plt.title("Feature Importance")
    plt.tight_layout()
    plt.savefig(PLOTS_DIR / "feature_importance.png")
    plt.close()


def save_sample_outputs(rf, scaler, knn, X, y, mae, rmse):
    SAMPLE_OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)

    metrics = {
        "mae": mae,
        "rmse": rmse,
        "n_samples": int(len(X)),
        "features": FEATURES,
    }
    with (SAMPLE_OUTPUTS_DIR / "model_metrics.json").open("w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    # Use a single sample from the dataset
    sample_row = X.iloc[[0]]
    sample_target = float(y.iloc[0])

    pred_price = float(rf.predict(sample_row)[0])

    # Predict response
    predict_response = {"predicted_price": pred_price}
    with (SAMPLE_OUTPUTS_DIR / "predict_response.json").open(
        "w", encoding="utf-8"
    ) as f:
        json.dump(predict_response, f, indent=2)

    # Comparables response (using scaled features)
    sample_row_scaled = scaler.transform(sample_row)
    distances, indices = knn.kneighbors(sample_row_scaled)
    indices = indices[0]
    comps = []
    for idx in indices:
        row = X.iloc[int(idx)]
        price = float(y.iloc[int(idx)])
        comp = {
            "price": price,
            "bedrooms": int(row["bedrooms"]),
            "bathrooms": float(row["bathrooms"]),
            "sqft_living": int(row["sqft_living"]),
            "sqft_lot": int(row["sqft_lot"]),
            "floors": float(row["floors"]),
            "zipcode": int(row["zipcode"]),
            "yr_built": int(row["yr_built"]),
        }
        comps.append(comp)

    comparables_response = {"comparables": comps}
    with (SAMPLE_OUTPUTS_DIR / "comparables_response.json").open(
        "w", encoding="utf-8"
    ) as f:
        json.dump(comparables_response, f, indent=2)

    # Analyze response (assume listed_price = actual price from dataset)
    listed_price = sample_target
    comps_avg_price = float(np.mean([c["price"] for c in comps])) if comps else pred_price

    if pred_price != 0:
        deviation_pct = float((listed_price - pred_price) / pred_price * 100.0)
    else:
        deviation_pct = 0.0

    if abs(deviation_pct) <= 5:
        pricing_flag = "fair"
    elif deviation_pct > 5:
        pricing_flag = "overpriced"
    else:
        pricing_flag = "underpriced"

    analyze_response = {
        "predicted_price": pred_price,
        "comps_avg_price": comps_avg_price,
        "listed_price": listed_price,
        "deviation_pct": deviation_pct,
        "pricing_flag": pricing_flag,
    }
    with (SAMPLE_OUTPUTS_DIR / "analyze_response.json").open(
        "w", encoding="utf-8"
    ) as f:
        json.dump(analyze_response, f, indent=2)


def main() -> None:
    ensure_directories()
    dataset_path = ensure_dataset()
    print(f"Using dataset at {dataset_path}")

    df = pd.read_csv(dataset_path)
    rf, scaler, knn, X, y, X_test, y_test, y_pred, mae, rmse = train_models(df)
    save_models(rf, scaler, knn)
    make_plots(y_test, y_pred, rf)
    save_sample_outputs(rf, scaler, knn, X, y, mae, rmse)


if __name__ == "__main__":
    main()

