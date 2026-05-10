// In production we hit an absolute backend URL (e.g. Render). In dev this is
// left empty so requests stay relative ("/api/...") and ride the Vite proxy
// configured in vite.config.js.
const RAW_BASE = import.meta.env.VITE_API_BASE_URL || ''
export const API_BASE = RAW_BASE.replace(/\/$/, '')

// Build an absolute or proxy-relative URL for an "/api/..." path.
export const apiUrl = (path) => {
  if (!path) return API_BASE
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE}${normalized}`
}

// Thin wrapper around fetch that prefixes API_BASE and forwards credentials
// (cookies are needed for the JWT auth cookie set by the Express server).
export const apiFetch = (path, options = {}) => {
  const { credentials = 'include', ...rest } = options
  return fetch(apiUrl(path), { credentials, ...rest })
}

export const parseJson = async (response) => {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch (error) {
    return null
  }
}
