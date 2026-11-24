export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  category: string;
  date: string;
  paymentMethod: string;
  notes: string;
  createdAt: string;
}

export interface TransactionPayload {
  type: TransactionType;
  description: string;
  amount: number;
  category: string;
  date: string;
  paymentMethod: string;
  notes: string;
}

export interface TransactionQuery {
  type?: TransactionType;
  category?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface TransactionListResponse {
  success: boolean;
  count: number;
  total: number;
  pagination: {
    page: number;
    limit: number;
    pages: number;
  };
  transactions: Transaction[];
}

export interface TransactionResponse {
  success: boolean;
  message: string;
  transaction: Transaction;
}
