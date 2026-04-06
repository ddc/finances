import client from "./client";
import type { Transfer } from "../types";

export const listTransfers = async (params?: Record<string, string>): Promise<Transfer[]> => {
  const { data } = await client.get<Transfer[]>("/transfers/", { params });
  return data;
};

export const createTransfer = async (transfer: Partial<Transfer>, transferFile?: File): Promise<Transfer> => {
  const formData = new FormData();
  Object.entries(transfer).forEach(([key, value]) => {
    if (value !== null && value !== undefined) formData.append(key, String(value));
  });
  if (transferFile) formData.append("transfer_file", transferFile);
  const { data } = await client.post<Transfer>("/transfers/", formData);
  return data;
};

export const updateTransfer = async (id: string, transfer: Partial<Transfer>, transferFile?: File): Promise<Transfer> => {
  const formData = new FormData();
  Object.entries(transfer).forEach(([key, value]) => {
    if (value !== null && value !== undefined) formData.append(key, String(value));
  });
  if (transferFile) formData.append("transfer_file", transferFile);
  const { data } = await client.put<Transfer>(`/transfers/${id}/`, formData);
  return data;
};

export const deleteTransfer = async (id: string): Promise<void> => {
  await client.delete(`/transfers/${id}/`);
};
