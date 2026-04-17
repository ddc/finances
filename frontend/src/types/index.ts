export interface User {
  id: string;
  username: string;
  role: "admin" | "viewer";
}


export interface ExpenseCategory {
  id: string;
  code: string;
  label: string;
}

export interface CurrencyOption {
  id: string;
  code: string;
  label: string;
  symbol: string;
}

export interface BankOption {
  id: string;
  code: string;
  label: string;
}

export interface CompanyOption {
  id: string;
  code: string;
  label: string;
}

export interface Expense {
  id: string;
  expense_date: string;
  category: string;
  category_code: string;
  category_label: string;
  description: string;
  amount: number;
  has_receipt_file: boolean;
  has_nfe_file: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Deposit {
  id: string;
  deposit_date: string;
  company: string;
  company_code: string;
  company_label: string;
  invoice_number: string;
  invoice_issue_date: string | null;
  period_start: string | null;
  period_end: string | null;
  currency: string;
  currency_code: string;
  currency_symbol: string;
  exchange_rate: number | null;
  exchange_rate_effective: number | null;
  operation_cost: number | null;
  financial_operation_tax: number | null;
  amount_foreign: number;
  amount_brl: number;
  has_nfe_file: boolean;
  has_invoice_file: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Transfer {
  id: string;
  transfer_date: string;
  deposit: string;
  bank: string;
  bank_code: string;
  bank_label: string;
  amount_brl: number;
  has_transfer_file: boolean;
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
  ptax_data_hora: string | null;
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
