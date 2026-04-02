import client from "./client";
import type { Deposit } from "../types";

export const listDeposits = async (params?: Record<string, string>): Promise<Deposit[]> => {
  const { data } = await client.get<Deposit[]>("/deposits/", { params });
  return data;
};

export const createDeposit = async (deposit: Partial<Deposit>): Promise<Deposit> => {
  const { data } = await client.post<Deposit>("/deposits/", deposit);
  return data;
};

export const updateDeposit = async (id: string, deposit: Partial<Deposit>): Promise<Deposit> => {
  const { data } = await client.put<Deposit>(`/deposits/${id}/`, deposit);
  return data;
};

export const deleteDeposit = async (id: string): Promise<void> => {
  await client.delete(`/deposits/${id}/`);
};
