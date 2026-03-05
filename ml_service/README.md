# ML Service for AI Real Estate

This folder contains the Python ML service for price prediction, comparables, and pricing analysis using the King County housing dataset (`kc_house_data.csv`).

The stack is **FastAPI + scikit-learn**, running next to the existing Node/Express API and React client.

## Folder structure

- `ml_service/data/`
  - `kc_house_data.csv` (dataset – must be placed here before training)
- `ml_service/models/`
  - `price_model.joblib` (RandomForestRegressor)
  - `knn_model.joblib` (NearestNeighbors)
  - `features.json` (ordered feature list)
- `ml_service/src/`
  - `train.py` (offline training + artifact and plot generation)
  - `api.py` (FastAPI app exposing `/predict`, `/comparables`, `/analyze`)
- `demo_artifacts/`
  - `plots/actual_vs_pred.png`
  - `plots/feature_importance.png`
  - `sample_outputs/model_metrics.json`
  - `sample_outputs/predict_response.json`
  - `sample_outputs/analyze_response.json`
  - `sample_outputs/comparables_response.json`

## 1. Create and activate a virtual environment

From the **repo root**:

```bash
cd ml_service
python -m venv .venv

# macOS / Linux
source .venv/bin/activate

# Windows (PowerShell)
.venv\Scripts\Activate.ps1
```

## 2. Install dependencies

With the virtual environment activated:

```bash
pip install -r requirements.txt
```

## 3. Dataset location

The training script expects the dataset at:

```text
ml_service/data/kc_house_data.csv
```

If the file is not present at this path, the training script will exit with a clear error
message explaining where to place `kc_house_data.csv`.

## 4. Run the training script

From `ml_service/` with the venv active:

```bash
python -m src.train
```

This will:

- Load `data/kc_house_data.csv`.
- Train a `RandomForestRegressor` and a `NearestNeighbors` comparables model.
- Compute and print **MAE** and **RMSE**.
- Save model artifacts to `ml_service/models/`:
  - `price_model.joblib`
  - `knn_model.joblib`
  - `features.json`
- Generate plots under `demo_artifacts/plots/`:
  - `actual_vs_pred.png`
  - `feature_importance.png`
- Write metrics and example JSON responses under `demo_artifacts/sample_outputs/`.

## 5. Start the FastAPI service

From `ml_service/` with the venv active:

```bash
uvicorn src.api:app --host 127.0.0.1 --port 8000 --reload
```

or:

```bash
python -m src.api
```

The service exposes:

- `GET /health`
- `POST /predict`
- `POST /comparables`
- `POST /analyze`

## 6. Start Node server and client

In separate terminals from the **repo root**:

```bash
cd server
npm run dev
```

```bash
cd client
npm run dev
```

With all three services running (FastAPI, Node, and Vite), the **“Analyze with AI”** button on the listing details page will call `/api/ml/analyze` via the Node backend and display pricing insights from the ML model.

