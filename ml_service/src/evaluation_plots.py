import json
from pathlib import Path

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


PROJECT_ROOT = Path(__file__).resolve().parents[2]
ML_ROOT = PROJECT_ROOT / "ml_service"
DATA_DIR = ML_ROOT / "data"
MODELS_DIR = ML_ROOT / "models"
DEMO_ARTIFACTS_DIR = PROJECT_ROOT / "demo_artifacts"
PLOTS_DIR = DEMO_ARTIFACTS_DIR / "plots"
SAMPLE_OUTPUTS_DIR = DEMO_ARTIFACTS_DIR / "sample_outputs"

DATASET_PATH = DATA_DIR / "kc_house_data.csv"
MODEL_PATH = MODELS_DIR / "price_model.joblib"


def ensure_paths() -> None:
  if not DATASET_PATH.is_file():
    raise FileNotFoundError(
      f"Dataset not found at {DATASET_PATH}. "
      "Place kc_house_data.csv in ml_service/data/ before running evaluation_plots.py."
    )
  if not MODEL_PATH.is_file():
    raise FileNotFoundError(
      f"Model artifact not found at {MODEL_PATH}. "
      "Run the training script (python -m src.train) before generating evaluation plots."
    )

  PLOTS_DIR.mkdir(parents=True, exist_ok=True)
  SAMPLE_OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)


def load_data_and_model():
  df = pd.read_csv(DATASET_PATH)
  model = joblib.load(MODEL_PATH)

  # Features used during training
  feature_names = [
    "bedrooms",
    "bathrooms",
    "sqft_living",
    "sqft_lot",
    "floors",
    "zipcode",
    "yr_built",
  ]

  df = df.dropna(subset=feature_names + ["price"])
  X = df[feature_names]
  y = df["price"]

  y_pred = model.predict(X)
  residuals = y - y_pred

  return df, X, y, y_pred, residuals


def compute_metrics(y, y_pred) -> dict:
  mae = mean_absolute_error(y, y_pred)
  rmse = np.sqrt(mean_squared_error(y, y_pred))
  r2 = r2_score(y, y_pred)
  return {
    "mae": mae,
    "rmse": rmse,
    "r2": r2,
    "n_samples": int(len(y)),
  }


def plot_residuals(y_pred, residuals):
  plt.figure()
  plt.scatter(y_pred, residuals, alpha=0.4)
  plt.axhline(0, color="red", linestyle="--", linewidth=1)
  plt.xlabel("Predicted price")
  plt.ylabel("Residual (actual - predicted)")
  plt.title("Residual Plot")
  plt.tight_layout()
  plt.savefig(PLOTS_DIR / "residual_plot.png")
  plt.close()


def plot_residual_distribution(residuals):
  plt.figure()
  sns.histplot(residuals, bins=40, kde=True)
  plt.xlabel("Residual (actual - predicted)")
  plt.ylabel("Count")
  plt.title("Residual Distribution")
  plt.tight_layout()
  plt.savefig(PLOTS_DIR / "residual_distribution.png")
  plt.close()


def plot_price_distribution(y):
  plt.figure()
  sns.histplot(y, bins=40, kde=False)
  plt.xlabel("Actual price")
  plt.ylabel("Count")
  plt.title("Price Distribution")
  plt.tight_layout()
  plt.savefig(PLOTS_DIR / "price_distribution.png")
  plt.close()


def plot_predicted_price_distribution(y, y_pred):
  """Overlay histograms of actual vs predicted prices."""
  plt.figure(figsize=(8, 5))
  sns.histplot(y, bins=40, label="Actual", alpha=0.6, kde=False)
  sns.histplot(y_pred, bins=40, label="Predicted", alpha=0.6, kde=False)
  plt.xlabel("Price")
  plt.ylabel("Count")
  plt.title("Predicted Price Distribution (Actual vs Predicted)")
  plt.legend()
  plt.tight_layout()
  plt.savefig(PLOTS_DIR / "predicted_price_distribution.png")
  plt.close()


def plot_sqft_vs_price(df: pd.DataFrame):
  """Scatter: sqft_living vs price."""
  plt.figure(figsize=(8, 5))
  plt.scatter(df["sqft_living"], df["price"], alpha=0.3, s=10)
  plt.xlabel("Square feet (living)")
  plt.ylabel("Price")
  plt.title("Top Feature Relationship: sqft_living vs price")
  plt.tight_layout()
  plt.savefig(PLOTS_DIR / "sqft_living_vs_price.png")
  plt.close()


def plot_correlation_heatmap(df: pd.DataFrame):
  cols = ["price", "sqft_living", "bedrooms", "bathrooms", "sqft_lot", "floors", "yr_built"]
  corr_df = df[cols].dropna()
  corr = corr_df.corr()

  plt.figure(figsize=(7, 5))
  sns.heatmap(
    corr,
    annot=True,
    fmt=".2f",
    cmap="viridis",
    cbar=True,
    square=True,
  )
  plt.title("Feature Correlation Heatmap")
  plt.tight_layout()
  plt.savefig(PLOTS_DIR / "correlation_heatmap.png")
  plt.close()


def save_metrics_json(metrics: dict):
  # Merge with any existing metrics fields if needed; for now we overwrite with core metrics.
  output_path = SAMPLE_OUTPUTS_DIR / "model_metrics.json"
  with output_path.open("w", encoding="utf-8") as f:
    json.dump(metrics, f, indent=2)


def main() -> None:
  ensure_paths()
  df, X, y, y_pred, residuals = load_data_and_model()

  metrics = compute_metrics(y, y_pred)
  plot_residuals(y_pred, residuals)
  plot_residual_distribution(residuals)
  plot_price_distribution(y)
  plot_predicted_price_distribution(y, y_pred)
  plot_sqft_vs_price(df)
  plot_correlation_heatmap(df)
  save_metrics_json(metrics)

  print("Evaluation plots generated in demo_artifacts/plots/")
  print("Model metrics written to demo_artifacts/sample_outputs/model_metrics.json")


if __name__ == "__main__":
  main()

