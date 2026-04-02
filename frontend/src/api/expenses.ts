import client from "./client";
import type { Expense } from "../types";

export const listExpenses = async (params?: Record<string, string>): Promise<Expense[]> => {
  const { data } = await client.get<Expense[]>("/expenses/", { params });
  return data;
};

export const createExpense = async (expense: Partial<Expense>): Promise<Expense> => {
  const { data } = await client.post<Expense>("/expenses/", expense);
  return data;
};

export const updateExpense = async (id: string, expense: Partial<Expense>): Promise<Expense> => {
  const { data } = await client.put<Expense>(`/expenses/${id}/`, expense);
  return data;
};

export const deleteExpense = async (id: string): Promise<void> => {
  await client.delete(`/expenses/${id}/`);
};
