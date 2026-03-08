export interface User {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  account_number: string;
  balance: number;
  is_active: boolean;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export type TransactionType = "transfer" | "deposit" | "withdraw";
export type TransactionStatus = "pending" | "completed" | "failed" | "reversed";

export interface Transaction {
  id: number;
  reference: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  description?: string;
  sender_id?: number;
  receiver_id?: number;
  sender_name?: string;
  receiver_name?: string;
  sender_account?: string;
  receiver_account?: string;
  sender_balance_after?: number;
  receiver_balance_after?: number;
  created_at: string;
}

export interface TransactionPage {
  total: number;
  page: number;
  page_size: number;
  pages: number;
  items: Transaction[];
}

export interface Summary {
  total_sent: number;
  total_received: number;
  total_deposits: number;
  total_withdrawals: number;
  net_flow: number;
  transaction_count: number;
  period: string;
}

export interface MonthlyData {
  month: string;
  sent: number;
  received: number;
  deposits: number;
}
