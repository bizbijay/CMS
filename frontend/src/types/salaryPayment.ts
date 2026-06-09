export interface SalaryPaymentListItem {
  id: number;
  userId: number;
  userName: string;
  amount: number;
  paidOn: string; // "YYYY-MM-DD"
  remarks: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateSalaryPaymentRequest {
  userId: number;
  amount: number;
  paidOn: string; // "YYYY-MM-DD"
  remarks?: string | null;
}

export interface UpdateSalaryPaymentRequest {
  userId: number;
  amount: number;
  paidOn: string; // "YYYY-MM-DD"
  remarks?: string | null;
}
