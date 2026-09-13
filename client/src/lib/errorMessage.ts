import axios from 'axios';

interface ApiErrorResponse {
  error?: {
    message?: string;
  };
}

export function getApiErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.error?.message ?? fallback;
  }
  return fallback;
}
