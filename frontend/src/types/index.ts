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
  category: "IMPOSTOS" | "PLANO_SAUDE" | "CONTABILIDADE" | "OTHER";
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
  amount_usd: number;
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
  ptax_usd_brl: number | null;
  ptax_fetched_at: string | null;
  summary: {
    total_income_brl: number;
    total_income_usd: number;
    total_expenses_brl: number;
    total_transferred_brl: number;
    net_balance_brl: number;
  };
  monthly: Array<{
    month: number;
    income_brl: number;
    income_usd: number;
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
