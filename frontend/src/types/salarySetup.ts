export interface SalarySetupListItem {
  id: number;
  userId: number;
  userName: string;
  monthlySalary: number;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateSalarySetupRequest {
  userId: number;
  monthlySalary: number;
}

export interface UpdateSalarySetupRequest {
  userId: number;
  monthlySalary: number;
}
