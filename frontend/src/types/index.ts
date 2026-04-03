export interface User {
  id: string;
  username: string;
  role: "admin" | "viewer";
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Expense {
  id: string;
  expense_date: string;
  category: "TAXES" | "HEALTH_INSURANCE" | "ACCOUNTING" | "TFE" | "OTHER";
  description: string;
  amount: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Deposit {
  id: string;
  deposit_date: string;
  invoice_number: string;
  invoice_issue_date: string;
  period_start: string;
  period_end: string;
  currency: "USD" | "EUR" | "GBP" | "CAD" | "AUD";
  amount_foreign: number;
  amount_brl: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Transfer {
  id: string;
  transfer_date: string;
  deposit: string;
  bank_name: "SANTANDER";
  amount_brl: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface NfeSample {
  id: string;
  description: string;
  body: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardData {
  year: number;
  month: number | null;
  currency: string;
  ptax_compra: string | null;
  ptax_venda: string | null;
  ptax_fetched_at: string | null;
  summary: {
    income_by_currency: Record<string, number>;
    total_income_brl: number;
    total_expenses_brl: number;
    total_transferred_brl: number;
    net_balance_brl: number;
  };
  monthly: Array<{
    month: number;
    income_brl: number;
    income_foreign: number;
    expenses_brl: number;
    transferred_brl: number;
  }>;
  recent_activity: Array<{
    type: "expense" | "deposit" | "transfer";
    description: string;
    amount_brl: number;
    date: string;
  }>;
}
