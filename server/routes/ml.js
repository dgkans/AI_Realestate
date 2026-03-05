import express from 'express'
import axios from 'axios'

const router = express.Router()

const ML_BASE_URL = process.env.ML_BASE_URL || 'http://127.0.0.1:8000'

const forwardToMl = async (path, req, res) => {
  try {
    const url = `${ML_BASE_URL}${path}`
    const response = await axios.post(url, req.body, {
      timeout: 4000,
    })
    return res.status(response.status).json(response.data)
  } catch (error) {
    const code = error.code || error.message
    if (code === 'ECONNREFUSED' || code === 'ECONNABORTED') {
      return res.status(503).json({ message: 'ML service unavailable.' })
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

  if (deviationPercent > 15) {
    recommendation = 'NEGOTIATE'
    risk = 'High'
    message =
      `This property appears significantly overpriced relative to the estimated market value. Compared to comparable properties, the list price is ${compsRelation} the comps average. Buyers may want to negotiate closer to the predicted fair value before proceeding.`
  } else if (deviationPercent < -10) {
    recommendation = 'POTENTIAL OPPORTUNITY'
    risk = 'Low'
    message =
      `The property appears underpriced relative to the predicted market value. Compared to comparable properties, the list price is ${compsRelation} the comps average. This may represent a potential investment opportunity.`
  } else {
    recommendation = 'FAIR VALUE'
    risk = 'Moderate'
    message =
      `The listing price is aligned with the model estimate. Compared to comparable properties, the list price is ${compsRelation} the comps average.`
  }

  return res.json({
    recommendation,
    risk,
    message,
  })
})

export default router

