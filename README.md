# Transforming Real Estate with AI

A full-stack real estate platform that pairs a polished React UI with a machine-learning service for **AI-assisted price analysis** and a **rule-based investment advisor**. Buyers, sellers, and investors can browse listings, post their own, save favorites, and click **Analyze with AI** on any property to instantly see whether it is fairly priced relative to comparable homes — along with a personalized recommendation that takes their budget and risk appetite into account.

This project was built as the capstone for **CPSC 597 (Project) at California State University, Fullerton**.

---

## Table of Contents
- [Overview](#overview)
- [Screenshots](#screenshots)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Repo Structure](#repo-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [ML Service & API](#ml-service--api)
- [Future Work](#future-work)
- [Author](#author)

---

## Overview

Most listing portals show a price and a few photos and stop there — buyers are left to guess whether the asking price is reasonable. **AI in Real Estate** plugs an ML pipeline directly into the listing detail page so every property can be evaluated against thousands of historical King County sales.

Behind the scenes:
- A **Random Forest regressor** predicts a fair market price from the listing's features (beds, baths, square footage, location, year built, etc.).
- A **K-Nearest Neighbors** model surfaces the most similar past sales to use as comparables.
- A **rule-based advisor** combines the deviation between listed and predicted price with the user's saved `preferredBudget` and `riskTolerance` (low / medium / high) to produce a personalized buy / hold / negotiate recommendation.
- A heuristic **confidence score** (derived from neighbor distances) tells the user how trustworthy each prediction is.

---

## Screenshots

### Homepage
![Homepage](screens/homepage.png)

### Browse Listings
![Browse Listings](screens/BrowseListings.png)

### Create a Listing
![Create Post](screens/CreatePost.png)

### My Listings
![User Listings](screens/UserListings.png)

### Profile & Preferences (budget + risk tolerance)
![Profile Update](screens/ProfileUpdate.png)

### Analyze with AI (price prediction, deviation, pricing flag, confidence, advisor)
![Analyze with AI](screens/AnalyzewithAI.png)

### Comparable Properties (KNN-retrieved similar past sales)
![Comparable Properties](screens/ComparableProperties.png)

---

## Features

### For Users
- **Authentication** — sign up / sign in with email + password (JWT-based sessions).
- **Profile preferences** — set a `preferredBudget` and `riskTolerance` once; AI recommendations adapt automatically.
- **Browse listings** — responsive grid of all available properties with image, price, and key details.
- **Create / edit / delete listings** — sellers can post their own properties with images, location, beds/baths, sqft, year built, and price.
- **Saved listings** — bookmark properties of interest and revisit them from a dedicated page.
- **My listings** — manage everything you've posted from a single dashboard.

### AI / ML
- **Predict fair price** — Random Forest model returns a predicted price for any listing.
- **Find comparable properties** — KNN surfaces the most similar past sales (with their actual prices) so users can sanity-check the prediction.
- **Pricing flag** — every property is tagged **Underpriced / Fair / Overpriced** based on percent deviation from the model's prediction. Thresholds adapt to the user's risk tolerance.
- **Confidence score** — heuristic score (0–100%) based on average distance to KNN neighbors, surfaced as a badge in the UI.
- **Personalized advisor** — rule-based engine that combines deviation, comp average, user budget, and risk tolerance to produce a clear, plain-English recommendation.
- **Collapsible AI panel** — clean summary tiles by default, with expandable sections for full insight and comparable-property tables.

### Engineering Niceties
- **Modular monorepo** — clean separation of `client/`, `server/`, and `ml_service/`.
- **Vite proxy** — frontend `/api` calls are proxied to the Express server; no CORS hacks in dev.
- **Hot reload** — `nodemon` for the API, Vite HMR for the client.
- **Seed script** — `npm run seed:demo` populates the DB with curated King County listings for demos.
- **Reproducible ML training** — `python3 -m src.train` rebuilds the Random Forest, KNN, and scaler artifacts under `ml_service/models/`.

---

## Tech Stack

### Frontend
- **React 18** + **Vite** (fast dev server, HMR)
- **Tailwind CSS** for the UI
- **React Router** for client-side routing
- **Fetch API** for talking to the backend

### Backend
- **Node.js** + **Express**
- **MongoDB** with **Mongoose** ODM
- **JWT** authentication + bcrypt password hashing
- **dotenvx / dotenv** for environment variable management
- **nodemon** for development hot-reload

### ML Service
- **Python 3** + **FastAPI**
- **scikit-learn** — `RandomForestRegressor`, `NearestNeighbors`, `StandardScaler`
- **NumPy / pandas** for feature engineering
- **uvicorn** ASGI server
- **joblib** for model persistence

### Tooling
- Git + GitHub for version control
- ESLint for the React codebase
- Postman / curl for API smoke testing

---

## Architecture

```
┌─────────────────┐     /api/*       ┌──────────────────┐    HTTP    ┌───────────────────┐
│  React Client   │ ───────────────▶ │  Express Server  │ ─────────▶ │  FastAPI ML       │
│  (Vite, Tailwind)│  proxied via     │  (Node.js)       │  /predict  │  Service (Python) │
│                 │   Vite dev server│                  │  /analyze  │  RandomForest +   │
└─────────────────┘ ◀─────────────── │  Auth + Mongo    │ ◀───────── │  KNN + Scaler     │
                       JSON          └──────────────────┘            └───────────────────┘
                                              │
                                              ▼
                                       ┌──────────────┐
                                       │  MongoDB     │
                                       │  Atlas       │
                                       └──────────────┘
```

- The client never talks to the ML service directly. All AI requests flow through the Node API, which adds the rule-based advisor logic on top of the raw ML output.

---

## Repo Structure

```
AI_Realestate/
├── client/              # React + Vite + Tailwind frontend
│   ├── src/
│   │   ├── pages/       # ListingDetails, BrowseListings, Profile, ...
│   │   ├── components/
│   │   └── ...
│   └── vite.config.js
├── server/              # Express API
│   ├── routes/          # auth.js, listings.js, ml.js, saved.js
│   ├── models/          # User, Listing, SavedListing (Mongoose)
│   ├── middleware/      # JWT auth middleware
│   ├── seed/            # demo listing seeder
│   └── index.js
├── ml_service/          # FastAPI microservice
│   ├── src/
│   │   ├── api.py                # /predict /comparables /analyze
│   │   ├── train.py              # trains RF + KNN + scaler
│   │   ├── balance_experiment.py # data balancing experiment
│   │   └── evaluation_plots.py
│   ├── data/            # CSV training data (gitignored)
│   ├── models/          # serialized .joblib artifacts (gitignored)
│   └── requirements.txt
├── screens/             # UI screenshots used in docs/report
└── README.md
```

---

## Getting Started

### Prerequisites
- **Node.js 18+** and **npm**
- **Python 3.10+**
- A **MongoDB Atlas** cluster (or any MongoDB URI)

### 1) Clone
```bash
git clone https://github.com/dgkans/AI_Realestate.git
cd AI_Realestate
```

### 2) Start the ML service
```bash
cd ml_service
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python3 -m src.api          # serves on http://localhost:8000
```

> The first run expects pre-trained model artifacts in `ml_service/models/`. If they're missing, train them with `python3 -m src.train` (you'll need a CSV under `ml_service/data/`).

### 3) Configure and start the backend
```bash
cd ../server
cp .env.example .env        # then fill in real MONGO_URI and JWT_SECRET
npm install
npm run seed:demo           # optional: seed demo listings
npm run dev                 # serves on http://localhost:5050
```

### 4) Start the frontend
```bash
cd ../client
npm install
npm run dev                 # serves on http://localhost:5173
```

Open <http://localhost:5173>, sign up, set your **preferred budget** and **risk tolerance** in your profile, browse a listing, and click **Analyze with AI**.

---

## Environment Variables

Create `server/.env` (never commit this file — it is gitignored). Use `server/.env.example` as a template:

| Variable        | Description                                    | Example                               |
| --------------- | ---------------------------------------------- | ------------------------------------- |
| `MONGO_URI`     | MongoDB connection string                      | `mongodb+srv://user:pass@cluster/db`  |
| `PORT`          | Express port                                   | `5050`                                |
| `CLIENT_ORIGIN` | Allowed CORS origin (the Vite dev server URL)  | `http://localhost:5173`               |
| `JWT_SECRET`    | Secret used to sign JWT tokens                 | a long random string                  |

The ML service has no required env variables and listens on port `8000` by default.

---

## ML Service & API

FastAPI exposes three endpoints (consumed by the Node backend, not by the client directly):

| Method | Path           | Purpose                                                                                        |
| ------ | -------------- | ---------------------------------------------------------------------------------------------- |
| POST   | `/predict`     | Returns the Random Forest predicted price for a property's features.                           |
| POST   | `/comparables` | Returns the K nearest historical sales for the given features.                                 |
| POST   | `/analyze`     | One-shot endpoint: prediction + comps + deviation % + pricing flag + confidence score.         |

The Express server adds a `POST /api/ml/advisor` endpoint that consumes `/analyze`'s output and applies the rule-based investment logic (budget + risk tolerance → buy / negotiate / pass message).

### Pricing flag thresholds (risk-tolerance aware)

| Risk     | Overpriced if deviation > | Underpriced if deviation < |
| -------- | -------------------------: | --------------------------: |
| Low      | +10%                       | −15%                        |
| Medium   | +15%                       | −10%                        |
| High     | +20%                       | −5%                         |

### Confidence score

Computed in `ml_service/src/api.py` from the average KNN distance:
```
confidence = 1 / (1 + mean(neighbor_distances))
```
A surface label (Low / Moderate / High) is shown alongside the percentage in the UI.

---

## Deployment (Free Tier)

The app is designed to run end-to-end on free hosting tiers:

| Layer | Vendor | Plan |
| --- | --- | --- |
| Frontend (Vite SPA) | **Vercel** | Hobby (free) |
| Backend (Express) | **Render** Web Service | Free |
| ML service (FastAPI) | **Render** Web Service | Free |
| Database | **MongoDB Atlas** | M0 (free) |
| Keep-alive ping | **cron-job.org** | Free |

The Random Forest in `ml_service/src/train.py` is intentionally tuned (`n_estimators=50`, `max_depth=15`, `joblib.dump(..., compress=3)`) so the serialized model stays around **4–5 MB** and the running service comfortably fits in the 512 MB Render free-tier RAM limit. Models are not committed to git — Render runs `python -m src.train` at build time and regenerates them from `ml_service/data/kc_house_data.csv`.

### Step 1 — MongoDB Atlas
1. In **Network Access**, add `0.0.0.0/0` (or Render's documented egress range).
2. Grab the connection string for your DB user and have it ready.

### Step 2 — Render (backend + ML)
The repo ships with a `render.yaml` Blueprint at the root.

1. Push the repo to GitHub (already done).
2. In Render → **New + → Blueprint** → connect this repo → apply.
3. Render will create two services: `ai-realestate-api` and `ai-realestate-ml`.
4. On the **ML service**, no extra env vars are required.
5. On the **API service**, fill in (Dashboard → Environment):
   - `MONGO_URI` → Atlas connection string (with the real password)
   - `JWT_SECRET` → any long random string
   - `ML_BASE_URL` → `https://ai-realestate-ml.onrender.com` (the URL of the ML service shown in Render)
   - `CLIENT_ORIGIN` → leave blank for now; we'll fill it in after Vercel
6. Note both Render URLs (e.g. `https://ai-realestate-api.onrender.com`, `https://ai-realestate-ml.onrender.com`).

### Step 3 — Vercel (frontend)
1. In Vercel → **Add New → Project** → import this GitHub repo.
2. Set **Root Directory** to `client/`.
3. Framework preset: **Vite** (auto-detected). Build command and output dir come from `client/vercel.json`.
4. Add **Environment Variable**:
   - `VITE_API_BASE_URL` → `https://ai-realestate-api.onrender.com` (your Render API URL, no trailing slash)
5. Deploy. Vercel gives you `https://<project>.vercel.app`.

### Step 4 — Finish wiring CORS
Back in Render, set `CLIENT_ORIGIN` on the API service to your Vercel URL (you can pass multiple comma-separated origins, e.g. `https://<project>.vercel.app,https://<project>-git-main-<user>.vercel.app`). Save → Render redeploys.

### Step 5 — Keep the free services warm (optional)
Render free services sleep after 15 min of inactivity (~50 s cold start). To avoid this on demo day:

1. Sign up at <https://cron-job.org> (free).
2. Add two jobs, every 14 minutes:
   - `GET https://ai-realestate-api.onrender.com/health`
   - `GET https://ai-realestate-ml.onrender.com/health`

### Local dev still works the same
When `VITE_API_BASE_URL` is unset (typical for `npm run dev`), the client falls back to relative `/api/...` URLs and the Vite proxy in `client/vite.config.js` forwards them to `http://localhost:5050`. No deployment-specific code paths need to run locally.

---

## Future Work

- Replace the rule-based advisor with an **LLM-powered explanation layer** that justifies recommendations in natural language.
- Switch from a heuristic confidence score to **proper prediction intervals** (e.g., quantile regression forests).
- Support **multiple metro areas** by retraining with city-stratified datasets.
- Add **interpretability** with SHAP / LIME plots in the UI.
- **Image-based feature extraction** (CNN on listing photos) for condition/quality estimation.
- **Price history time-series** + market-trend forecasting.
- Deploy to a managed environment (Render / Fly.io for the API, Vercel for the client, a Python container for the ML service).

---

## Author

**Gaurav Desai** — California State University, Fullerton (CPSC 597, Spring 2026)
GitHub: [@dgkans](https://github.com/dgkans)
