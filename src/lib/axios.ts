import axios, { AxiosError } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/auth.store";
import type { IUserSession } from "@/api/auth/auth.interface";

interface RetryAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export interface IRefreshTokenResponse {
  message: string;
  data: {
    accessToken: string;
    user: IUserSession;
  };
}

function isRefreshRequest(url?: string) {
  return url?.includes("/auth/refresh-token") ?? false;
}

function shouldSkipAutoRefresh(url?: string) {
  if (!url) {
    return false;
  }

  return (
    isRefreshRequest(url) ||
    url.includes("/auth/login") ||
    url.includes("/auth/register") ||
    url.includes("/auth/request-forgot-password") ||
    url.includes("/auth/forgot-password/") ||
    url.includes("/auth/verify/")
  );
}

function clearPersistedSession() {
  useAuthStore.getState().clearSession();

  try {
    useAuthStore.persist.clearStorage();
  } catch (error) {
    console.error("failed to clear persisted auth storage", error);
  }
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const accessToken = useAuthStore.getState().accessToken;

    if (accessToken && !isRefreshRequest(config.url)) {
      config.headers.set("Authorization", `Bearer ${accessToken}`);
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryAxiosRequestConfig;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const skipAutoRefresh = shouldSkipAutoRefresh(originalRequest.url);

    if (status === 401 && !originalRequest._retry && !skipAutoRefresh) {
      originalRequest._retry = true;

      try {
        const response = await api.post<IRefreshTokenResponse>(
          "/auth/refresh-token",
        );
        const { accessToken: newAccessToken, user } = response.data.data;

        useAuthStore.getState().setSession(user, newAccessToken);

        originalRequest.headers.set(
          "Authorization",
          `Bearer ${newAccessToken}`,
        );

        return api(originalRequest);
      } catch {
        clearPersistedSession();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
