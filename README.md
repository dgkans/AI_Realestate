# AI in Real Estate (Checkpoint 1)

UI-first MVP for the real estate platform. This milestone focuses on polished UI, routing, and mock data, with a minimal Express API scaffold.

## Repo Structure
- `client/` React + Vite + Tailwind UI
- `server/` Express API scaffold
- `ml-service/` (coming in Milestone 1.5)

## Quick Start

### 1) Server
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

### 2) Client
```bash
cd client
npm install
npm run dev
```

The client proxies `/api` to `http://localhost:5050`.
