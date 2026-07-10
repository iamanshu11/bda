import { AxiosError } from 'axios';

/** Extract a user-friendly message from an API/Axios error. */
export function getApiErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (err instanceof AxiosError) {
    if (err.response?.data?.message) return err.response.data.message as string;
    if (err.code === 'ERR_NETWORK') return 'Cannot reach the server. Please try again later.';
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
