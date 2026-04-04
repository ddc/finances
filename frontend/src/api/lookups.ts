import client from "./client";
import type { ExpenseCategory, CurrencyOption, BankOption, CompanyOption } from "../types";

export const listExpenseCategories = async (): Promise<ExpenseCategory[]> => {
  const { data } = await client.get<ExpenseCategory[]>("/expense-categories/");
  return data;
};

export const listCurrencies = async (): Promise<CurrencyOption[]> => {
  const { data } = await client.get<CurrencyOption[]>("/currencies/");
  return data;
};

export const listBanks = async (): Promise<BankOption[]> => {
  const { data } = await client.get<BankOption[]>("/banks/");
  return data;
};

export const listCompanies = async (): Promise<CompanyOption[]> => {
  const { data } = await client.get<CompanyOption[]>("/companies/");
  return data;
};
