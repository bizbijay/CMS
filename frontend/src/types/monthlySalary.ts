export interface MonthlySalaryRow {
  id: number | null;
  userId: number;
  userName: string;
  defaultSalary: number;
  amount: number;
  isVerified: boolean;
  month: number;
  year: number;
}

export interface SaveMonthlySalaryRequest {
  userId: number;
  month: number;
  year: number;
  amount: number;
  isVerified: boolean;
}
