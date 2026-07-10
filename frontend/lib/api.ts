import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

/**
 * Pre-configured Axios instance for the BDA backend API.
 * - Sends the httpOnly refresh cookie (withCredentials).
 * - Injects the in-memory access token on every request.
 * - On a 401, transparently calls /auth/refresh once and retries.
 */
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000/api/v1',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Access token is kept in memory only (never localStorage) for security.
let accessToken: string | null = null;
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};
export const getAccessToken = () => accessToken;

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await axios.post(
      `${api.defaults.baseURL}/auth/refresh`,
      {},
      { withCredentials: true },
    );
    const token = res.data?.data?.accessToken ?? null;
    setAccessToken(token);
    return token;
  } catch {
    setAccessToken(null);
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const isAuthCall = original?.url?.includes('/auth/');

    if (error.response?.status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      refreshing = refreshing ?? refreshAccessToken();
      const token = await refreshing;
      refreshing = null;
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  },
);
