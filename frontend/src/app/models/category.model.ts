export type CategoryType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  isDefault: boolean;
  createdAt?: string;
}

export interface CategoryPayload {
  name: string;
  type: CategoryType;
}

export interface CategoryListResponse {
  success: boolean;
  count: number;
  categories: Category[];
}
