import { Transaction } from './transaction.model';

export interface CategoryBreakdownItem {
  category: string;
  amount: number;
  count?: number;
  percentage: number;
  color: string;
}

export interface MonthlyTrendItem {
  month: string;
  key: string;
  income: number;
  expense: number;
}

export interface DashboardData {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  monthlyExpense: number;
  previousMonthExpense: number;
  monthlyChange: number;
  transactionCount: number;
  incomeCount: number;
  expenseCount: number;
  recentTransactions: Transaction[];
  categoryBreakdown: CategoryBreakdownItem[];
  monthlyTrend: MonthlyTrendItem[];
}

export interface DashboardResponse {
  success: boolean;
  data: DashboardData;
}

export type ReportPeriod = 'day' | 'week' | 'month' | 'year';

export interface ReportSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  transactionCount: number;
  expenseCount: number;
  incomeCount: number;
  averageExpense: number;
  largestExpense: Transaction | null;
  topCategory: CategoryBreakdownItem | null;
}

export interface PaymentSummaryItem {
  method: string;
  amount: number;
}

export interface TrendItem {
  label: string;
  amount: number;
  count: number;
}

export interface ReportData {
  period: ReportPeriod;
  periodLabel: string;
  startDate: string;
  endDate: string;
  category: string | null;
  summary: ReportSummary;
  categorySummary: CategoryBreakdownItem[];
  paymentSummary: PaymentSummaryItem[];
  trend: TrendItem[];
}

export interface ReportResponse {
  success: boolean;
  data: ReportData;
}
