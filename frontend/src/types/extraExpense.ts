export interface ExtraExpenseListItem {
  id: number;
  expensedById?: number | null;
  expensedByName: string;
  expensedByOther?: string | null;
  item: string;
  quantity?: number | null;
  cost?: number | null;
  totalCost: number;
  remarks?: string | null;
  isVerified: boolean;
  verifiedById?: number | null;
  verifiedByName?: string | null;
  verifiedAt?: string | null;
  date: string;
  createdById?: number | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateExtraExpenseRequest {
  expensedById?: number | null;
  expensedByOther?: string | null;
  item: string;
  quantity?: number | null;
  cost?: number | null;
  totalCost: number;
  remarks?: string | null;
  date: string;
}

export interface UpdateExtraExpenseRequest {
  expensedById?: number | null;
  expensedByOther?: string | null;
  item: string;
  quantity?: number | null;
  cost?: number | null;
  totalCost: number;
  remarks?: string | null;
  date: string;
}
