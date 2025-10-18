import { apiClient } from "./api";

interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
  };
}

class AuthService {
  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>("/auth/login", {
      username,
      password,
    });
    return response.data;
  }

  async register(username: string, password: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>("/auth/register", {
      username,
      password,
    });
    return response.data;
  }

  async getCurrentUser(): Promise<{ id: number; username: string }> {
    const response = await apiClient.get<{
      user: { id: number; username: string };
    }>("/auth/me");
    return response.data.user;
  }

  async logout(): Promise<void> {
    await apiClient.post("/auth/logout");
  }
}

export const authService = new AuthService();
