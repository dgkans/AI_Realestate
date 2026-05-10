import express from 'express'
import axios from 'axios'

const router = express.Router()

// Strip any trailing slash to avoid double-slash URLs when joining with paths.
const ML_BASE_URL = (process.env.ML_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')

// Render free Web Services sleep after 15 min idle and need ~30-50s to wake
// up. The default 4s timeout is fine locally but kills the first request in
// production. 60s gives the ML service plenty of room to cold-start before
// we surface a real 503 to the user.
const ML_TIMEOUT_MS = Number(process.env.ML_TIMEOUT_MS || 60000)

const forwardToMl = async (path, req, res) => {
  try {
    const url = `${ML_BASE_URL}${path}`
    const response = await axios.post(url, req.body, {
      timeout: ML_TIMEOUT_MS,
    })
    return res.status(response.status).json(response.data)
  } catch (error) {
    const code = error.code || error.message
    if (code === 'ECONNREFUSED' || code === 'ECONNABORTED' || code === 'ETIMEDOUT') {
      return res
        .status(503)
        .json({ message: 'ML service is waking up. Please try again in a few seconds.' })
    }
    const status = error.response?.status || 500
    const message =
      error.response?.data?.detail || error.response?.data?.message || 'ML service error.'
    console.error('ML route error:', code, message)
    return res.status(status).json({ message })
  }
}

router.post('/predict', async (req, res) => {
  return forwardToMl('/predict', req, res)
})

router.post('/comparables', async (req, res) => {
  return forwardToMl('/comparables', req, res)
})

router.post('/analyze', async (req, res) => {
  return forwardToMl('/analyze', req, res)
})

// Investment advisor: simple rule-based engine that simulates the LLM advisor
// described in the project report. In the future this can be replaced by a
// ChatGPT (or similar) API call that takes the same fields and generates a
// richer, free-form recommendation for the buyer.
router.post('/advisor', (req, res) => {
  const {
    predicted_price: predictedPrice,
    listed_price: listedPrice,
    comps_avg_price: compsAvgPrice,
    deviation_percent: deviationPercent,
    preferred_budget: preferredBudget,
    risk_tolerance: riskTolerance,
  } = req.body || {}

  if (
    typeof predictedPrice !== 'number' ||
    typeof listedPrice !== 'number' ||
    typeof compsAvgPrice !== 'number' ||
    typeof deviationPercent !== 'number'
  ) {
    return res.status(400).json({ message: 'Invalid advisor input payload.' })
  }

  let recommendation
  let risk
  let message

  const compsDeltaPct =
    compsAvgPrice > 0 ? ((listedPrice - compsAvgPrice) / compsAvgPrice) * 100 : 0
  const compsRelation =
    compsDeltaPct > 5 ? 'above' : compsDeltaPct < -5 ? 'below' : 'close to'

  const tol = typeof riskTolerance === 'string' ? riskTolerance.toLowerCase() : ''
  // Interpret the same model deviation differently depending on user's risk tolerance.
  // These thresholds are intentionally simple + explainable for the project demo.
  const overThreshold = tol === 'low' ? 10 : tol === 'high' ? 20 : 15
  const underThreshold = tol === 'low' ? -15 : tol === 'high' ? -5 : -10

  if (deviationPercent > overThreshold) {
    recommendation = 'NEGOTIATE'
    risk = 'High'
    message =
      `This property appears overpriced relative to the estimated market value using your "${tol || 'medium'}" risk tolerance. Compared to comparable properties, the list price is ${compsRelation} the comps average. Buyers may want to negotiate closer to the predicted fair value before proceeding.`
  } else if (deviationPercent < underThreshold) {
    recommendation = 'POTENTIAL OPPORTUNITY'
    risk = 'Low'
    message =
      `This property appears underpriced relative to the estimated market value using your "${tol || 'medium'}" risk tolerance. Compared to comparable properties, the list price is ${compsRelation} the comps average. This may represent a potential investment opportunity.`
  } else {
    recommendation = 'FAIR VALUE'
    risk = 'Moderate'
    message =
      `The listing price is aligned with the model estimate using your "${tol || 'medium'}" risk tolerance. Compared to comparable properties, the list price is ${compsRelation} the comps average.`
  }

  let budget_note = null
  if (typeof preferredBudget === 'number' && preferredBudget > 0) {
    const fmt = (n) => Math.round(n).toLocaleString()
    if (listedPrice <= preferredBudget) {
      const headroom = preferredBudget - listedPrice
      budget_note = `Your profile budget is $${fmt(preferredBudget)}. This listing is within budget with about $${fmt(headroom)} of headroom at list price.`
    } else {
      const over = listedPrice - preferredBudget
      const overPct = (over / preferredBudget) * 100
      budget_note = `Your profile budget is $${fmt(preferredBudget)}; the list price is $${fmt(over)} over (~${overPct.toFixed(1)}%).`
    }
  }

  return res.json({
    recommendation,
    risk,
    message,
    budget_note,
  })
})

export default router

