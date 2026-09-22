import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

export const api = axios.create({
  baseURL,
  timeout: 15000,
});

function isAccessTokenExpired(token: string | null): boolean {
  if (!token) {
    return false;
  }

  try {
    const parts = token.split(".");

    if (parts.length !== 3) {
      return false;
    }

    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");

    const paddedPayload = payload.padEnd(
      Math.ceil(payload.length / 4) * 4,
      "=",
    );

    const decoded = JSON.parse(atob(paddedPayload)) as {
      exp?: number;
    };

    if (typeof decoded.exp !== "number") {
      return false;
    }

    return decoded.exp * 1000 <= Date.now();
  } catch {
    return false;
  }
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("kc_access");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

let refreshing = false;

let waiters: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const request = error.config;

    const status = error.response?.status;

    const accessToken = localStorage.getItem("kc_access");

    const refreshToken = localStorage.getItem("kc_refresh");

    const expiredTokenForbidden =
      status === 403 && isAccessTokenExpired(accessToken);

    const shouldRefresh = status === 401 || expiredTokenForbidden;

    if (shouldRefresh && !request?._retry && refreshToken) {
      request._retry = true;

      if (refreshing) {
        return new Promise((resolve) => {
          waiters.push((newToken) => {
            request.headers.Authorization = `Bearer ${newToken}`;

            resolve(api(request));
          });
        });
      }

      refreshing = true;

      try {
        const response = await axios.post(`${baseURL}/auth/refresh`, {
          refreshToken,
        });

        const newAccessToken = response.data.data.accessToken;

        const newRefreshToken = response.data.data.refreshToken;

        localStorage.setItem("kc_access", newAccessToken);

        localStorage.setItem("kc_refresh", newRefreshToken);

        waiters.forEach((waiter) => waiter(newAccessToken));

        waiters = [];

        request.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(request);
      } finally {
        refreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export const data = <T = unknown>(
  promise: Promise<{
    data: {
      data: T;
    };
  }>,
) => promise.then((response) => response.data.data);
