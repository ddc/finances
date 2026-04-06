import client from "./client";
import type { DashboardData } from "../types";

export const getDashboard = async (year?: number, month?: number, currency?: string): Promise<DashboardData> => {
  const params: Record<string, number | string> = {};
  if (year) params.year = year;
  if (month) params.month = month;
  if (currency) params.currency = currency;
  const { data } = await client.get<DashboardData>("/dashboard/", { params });
  return data;
};
