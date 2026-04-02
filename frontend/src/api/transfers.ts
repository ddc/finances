import client from "./client";
import type { Transfer } from "../types";

export const listTransfers = async (params?: Record<string, string>): Promise<Transfer[]> => {
  const { data } = await client.get<Transfer[]>("/transfers/", { params });
  return data;
};

export const createTransfer = async (transfer: Partial<Transfer>): Promise<Transfer> => {
  const { data } = await client.post<Transfer>("/transfers/", transfer);
  return data;
};

export const updateTransfer = async (id: string, transfer: Partial<Transfer>): Promise<Transfer> => {
  const { data } = await client.put<Transfer>(`/transfers/${id}/`, transfer);
  return data;
};

export const deleteTransfer = async (id: string): Promise<void> => {
  await client.delete(`/transfers/${id}/`);
};
