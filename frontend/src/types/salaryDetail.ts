export interface SalaryDetailDto {
  id: number;
  userId: number;
  userName: string;
  totalSalary: number;
  paid: number;
  remaining: number;
}

export interface MonthlySalaryBreakdownItem {
  month: number;
  year: number;
  amount: number;
  isVerified: boolean;
}

export interface WageBreakdownItem {
  transportationId: number;
  date: string;
  wages: number;
  projectName: string | null;
  vendorName: string | null;
  operatedTimeMs: number | null;
  startMeter: number | null;
  endMeter: number | null;
  totalMeterRun: number | null;
}

export interface SalaryBreakdownDto {
  userId: number;
  userName: string;
  totalFromMonthlySalaries: number;
  totalFromWages: number;
  grandTotal: number;
  monthlySalaries: MonthlySalaryBreakdownItem[];
  wages: WageBreakdownItem[];
}
