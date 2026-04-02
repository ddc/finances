import client from "./client";
import type { AuthResponse, User } from "../types";

export const login = async (username: string, password: string): Promise<AuthResponse> => {
  const { data } = await client.post<AuthResponse>("/auth/login/", { username, password });
  return data;
};

export const logout = async (): Promise<void> => {
  await client.post("/auth/logout/");
};

export const getMe = async (): Promise<User> => {
  const { data } = await client.get<User>("/auth/me/");
  return data;
};
