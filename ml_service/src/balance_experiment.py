import json
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split


PROJECT_ROOT = Path(__file__).resolve().parents[2]
ML_ROOT = PROJECT_ROOT / "ml_service"
DATASET_PATH = ML_ROOT / "data" / "kc_house_data.csv"
DEMO_ARTIFACTS_DIR = PROJECT_ROOT / "demo_artifacts"
PLOTS_DIR = DEMO_ARTIFACTS_DIR / "plots"
SAMPLE_OUTPUTS_DIR = DEMO_ARTIFACTS_DIR / "sample_outputs"

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
RANDOM_STATE = 42


def ensure_paths() -> None:
    if not DATASET_PATH.is_file():
        raise FileNotFoundError(
            f"Dataset not found at {DATASET_PATH}. "
            "Place kc_house_data.csv in ml_service/data/ before running this experiment."
        )
    PLOTS_DIR.mkdir(parents=True, exist_ok=True)
    SAMPLE_OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)


def load_data() -> tuple[pd.DataFrame, pd.Series]:
    df = pd.read_csv(DATASET_PATH)
    df = df.dropna(subset=FEATURES + [TARGET])
    return df[FEATURES], df[TARGET]


def compute_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    mae = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    r2 = r2_score(y_true, y_pred)
    return {"mae": float(mae), "rmse": float(rmse), "r2": float(r2)}


def compute_band_mae(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    # Price tiers are based on held-out true prices for fair comparison.
    q1, q3 = np.quantile(y_true, [0.25, 0.75])
    low_mask = y_true <= q1
    mid_mask = (y_true > q1) & (y_true <= q3)
    high_mask = y_true > q3

    def safe_mae(mask: np.ndarray) -> float | None:
        if np.sum(mask) == 0:
            return None
        return float(mean_absolute_error(y_true[mask], y_pred[mask]))

    return {
        "low": safe_mae(low_mask),
        "mid": safe_mae(mid_mask),
        "high": safe_mae(high_mask),
        "q1_price": float(q1),
        "q3_price": float(q3),
    }


def train_and_predict(
    x_train: pd.DataFrame,
    y_train: pd.Series,
    x_test: pd.DataFrame,
    *,
    log_target: bool = False,
) -> np.ndarray:
    model = RandomForestRegressor(
        n_estimators=200,
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )
    if log_target:
        y_train_fit = np.log1p(y_train.values)
        model.fit(x_train, y_train_fit)
        y_pred_log = model.predict(x_test)
        y_pred = np.expm1(y_pred_log)
    else:
        model.fit(x_train, y_train.values)
        y_pred = model.predict(x_test)
    return y_pred


def run_experiment() -> dict:
    x, y = load_data()
    x_train, x_test, y_train, y_test = train_test_split(
        x, y, test_size=0.2, random_state=RANDOM_STATE
    )

    results: list[dict] = []
    y_test_np = y_test.to_numpy()

    # Arm A: Baseline
    y_pred_base = train_and_predict(x_train, y_train, x_test, log_target=False)
    metrics_base = compute_metrics(y_test_np, y_pred_base)
    band_base = compute_band_mae(y_test_np, y_pred_base)
    results.append(
        {
            "arm": "baseline_full_data",
            "train_rows": int(len(x_train)),
            "test_rows": int(len(x_test)),
            **metrics_base,
            "band_mae": band_base,
        }
    )

    # Arm B: Balanced subset (upper-tail trim at training P95)
    p95 = float(np.quantile(y_train.values, 0.95))
    keep_mask = y_train.values <= p95
    x_train_bal = x_train.loc[keep_mask]
    y_train_bal = y_train.loc[keep_mask]
    y_pred_bal = train_and_predict(x_train_bal, y_train_bal, x_test, log_target=False)
    metrics_bal = compute_metrics(y_test_np, y_pred_bal)
    band_bal = compute_band_mae(y_test_np, y_pred_bal)
    results.append(
        {
            "arm": "balanced_train_p95",
            "train_rows": int(len(x_train_bal)),
            "test_rows": int(len(x_test)),
            "train_price_cap_p95": p95,
            **metrics_bal,
            "band_mae": band_bal,
        }
    )

    # Arm C: Log target transform
    y_pred_log = train_and_predict(x_train, y_train, x_test, log_target=True)
    metrics_log = compute_metrics(y_test_np, y_pred_log)
    band_log = compute_band_mae(y_test_np, y_pred_log)
    results.append(
        {
            "arm": "log_target_full_data",
            "train_rows": int(len(x_train)),
            "test_rows": int(len(x_test)),
            **metrics_log,
            "band_mae": band_log,
        }
    )

    return {
        "dataset_path": str(DATASET_PATH),
        "feature_set": FEATURES,
        "target": TARGET,
        "random_state": RANDOM_STATE,
        "test_split": 0.2,
        "results": results,
    }


def save_results(summary: dict) -> None:
    output_json = SAMPLE_OUTPUTS_DIR / "price_balance_experiment.json"
    with output_json.open("w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    # Comparison chart for overall error metrics
    arms = [r["arm"] for r in summary["results"]]
    mae_vals = [r["mae"] for r in summary["results"]]
    rmse_vals = [r["rmse"] for r in summary["results"]]

    x_pos = np.arange(len(arms))
    width = 0.35

    plt.figure(figsize=(9, 5))
    plt.bar(x_pos - width / 2, mae_vals, width, label="MAE")
    plt.bar(x_pos + width / 2, rmse_vals, width, label="RMSE")
    plt.xticks(x_pos, arms, rotation=15, ha="right")
    plt.ylabel("Error ($)")
    plt.title("Price Balance Experiment: Baseline vs Variants")
    plt.legend()
    plt.tight_layout()
    plt.savefig(PLOTS_DIR / "price_balance_comparison.png")
    plt.close()


def print_summary(summary: dict) -> None:
    print("Price balance experiment complete:")
    for r in summary["results"]:
        print(
            f"- {r['arm']}: "
            f"MAE={r['mae']:,.2f}, RMSE={r['rmse']:,.2f}, R2={r['r2']:.4f}, "
            f"train_rows={r['train_rows']}, test_rows={r['test_rows']}"
        )


def main() -> None:
    ensure_paths()
    summary = run_experiment()
    save_results(summary)
    print_summary(summary)
    print("Saved:")
    print(f"- {SAMPLE_OUTPUTS_DIR / 'price_balance_experiment.json'}")
    print(f"- {PLOTS_DIR / 'price_balance_comparison.png'}")


if __name__ == "__main__":
    main()
