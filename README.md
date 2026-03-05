# AI in Real Estate (Checkpoint 1)

UI-first MVP for the real estate platform. This milestone focuses on polished UI, routing, and mock data, with a minimal Express API scaffold.

## Repo Structure
- `client/` React + Vite + Tailwind UI
- `server/` Express API scaffold
- `ml-service/` (coming in Milestone 1.5)

## Quick Start

### 1) Start ML service
From `ml_service/` (after creating a virtualenv and installing `requirements.txt` as described in `ml_service/README.md`):

```bash
cd ml_service
python -m src.api
```

### 2) Seed demo listings
In a separate terminal from the **repo root**:

```bash
cd server
npm install
npm run seed:demo
```

This clears existing listings owned by the system demo user (`system@gdrealty.com`) and reseeds fresh
ML-anchored King County listings. It does **not** touch listings created by real users.

### 3) Server
```bash
cd server
npm install
npm run dev
```

Database
- MongoDB with Mongoose
- Connection string: `MONGO_URI` environment variable
- If `MONGO_URI` is not set, the API starts without a DB connection (UI-only mode)

Optional environment variables:
- `PORT=5050`
- `MONGO_URI=mongodb://...`
- `CLIENT_ORIGIN=http://localhost:5173`

### 4) Client
```bash
cd client
npm install
npm run dev
```

The client proxies `/api` to `http://localhost:5050`.
