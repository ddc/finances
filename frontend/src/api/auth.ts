import client from "./client";
import type { User } from "../types";

interface LoginResponse {
  user: User;
}

export const login = async (username: string, password: string): Promise<LoginResponse> => {
  const { data } = await client.post<LoginResponse>("/auth/login/", { username, password });
  return data;
};

export const logout = async (): Promise<void> => {
  await client.post("/auth/logout/");
};

export const getMe = async (): Promise<User> => {
  const { data } = await client.get<User>("/auth/me/");
  return data;
};
