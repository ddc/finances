import client from "./client";
import type { Deposit } from "../types";

export const listDeposits = async (params?: Record<string, string>): Promise<Deposit[]> => {
  const { data } = await client.get<Deposit[]>("/deposits/", { params });
  return data;
};

export const createDeposit = async (deposit: Partial<Deposit>, nfeFile?: File, invoiceFile?: File, statementFile?: File, conversionFile?: File): Promise<Deposit> => {
  const formData = new FormData();
  Object.entries(deposit).forEach(([key, value]) => {
    if (value !== null && value !== undefined) formData.append(key, String(value));
  });
  if (nfeFile) formData.append("nfe_file", nfeFile);
  if (invoiceFile) formData.append("invoice_file", invoiceFile);
  if (statementFile) formData.append("transaction_file", statementFile);
  if (conversionFile) formData.append("conversion_file", conversionFile);
  const { data } = await client.post<Deposit>("/deposits/", formData);
  return data;
};

export const updateDeposit = async (id: string, deposit: Partial<Deposit>, nfeFile?: File, invoiceFile?: File, statementFile?: File, conversionFile?: File): Promise<Deposit> => {
  const formData = new FormData();
  Object.entries(deposit).forEach(([key, value]) => {
    if (value !== null && value !== undefined) formData.append(key, String(value));
  });
  if (nfeFile) formData.append("nfe_file", nfeFile);
  if (invoiceFile) formData.append("invoice_file", invoiceFile);
  if (statementFile) formData.append("transaction_file", statementFile);
  if (conversionFile) formData.append("conversion_file", conversionFile);
  const { data } = await client.put<Deposit>(`/deposits/${id}/`, formData);
  return data;
};

export const deleteDeposit = async (id: string): Promise<void> => {
  await client.delete(`/deposits/${id}/`);
};
