import axios, { AxiosInstance, AxiosResponse } from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5001/api";

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          console.error("Unauthorized, redirecting to login...");
          localStorage.removeItem("token");
        }
        return Promise.reject(error);
      }
    );
  }

  get<T>(url: string, config?: object): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, config);
  }

  post<T>(url: string, data?: any, config?: object): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, data, config);
  }

  put<T>(url: string, data?: any, config?: object): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data, config);
  }

  delete<T>(url: string, config?: object): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(url, config);
  }
}

export const apiClient = new ApiClient();
