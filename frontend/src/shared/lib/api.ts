import axios, { type AxiosInstance } from 'axios'

let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

const api: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  withCredentials: true, // send HttpOnly refresh cookie
})

// Attach access token to every request
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// On 401, attempt silent refresh once
let refreshing: Promise<string | null> | null = null

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      if (!refreshing) {
        refreshing = axios
          .post<{ access_token: string }>('/api/v1/auth/refresh', null, { withCredentials: true })
          .then((r) => {
            const token = r.data.access_token
            setAccessToken(token)
            refreshing = null
            return token
          })
          .catch(() => {
            setAccessToken(null)
            refreshing = null
            return null
          })
      }
      const token = await refreshing
      if (token) {
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      }
    }
    return Promise.reject(error)
  },
)

export default api
