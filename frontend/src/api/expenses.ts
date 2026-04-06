import client from "./client";
import type { Expense } from "../types";

export const listExpenses = async (params?: Record<string, string>): Promise<Expense[]> => {
  const { data } = await client.get<Expense[]>("/expenses/", { params });
  return data;
};

export const createExpense = async (expense: Partial<Expense>, receiptFile?: File): Promise<Expense> => {
  const formData = new FormData();
  Object.entries(expense).forEach(([key, value]) => {
    if (value !== null && value !== undefined) formData.append(key, String(value));
  });
  if (receiptFile) formData.append("receipt_file", receiptFile);
  const { data } = await client.post<Expense>("/expenses/", formData);
  return data;
};

export const updateExpense = async (id: string, expense: Partial<Expense>, receiptFile?: File): Promise<Expense> => {
  const formData = new FormData();
  Object.entries(expense).forEach(([key, value]) => {
    if (value !== null && value !== undefined) formData.append(key, String(value));
  });
  if (receiptFile) formData.append("receipt_file", receiptFile);
  const { data } = await client.put<Expense>(`/expenses/${id}/`, formData);
  return data;
};

export const deleteExpense = async (id: string): Promise<void> => {
  await client.delete(`/expenses/${id}/`);
};
