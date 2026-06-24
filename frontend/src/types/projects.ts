export interface ProjectListItem {
  id: number;
  name: string;
  address?: string | null;
  issuedOfficeId?: number | null;
  issuedOfficeName?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  projectCost?: number | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateProjectRequest {
  name: string;
  address?: string | null;
  issuedOfficeId?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  projectCost?: number | null;
}

export interface UpdateProjectRequest {
  name: string;
  address?: string | null;
  issuedOfficeId?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  projectCost?: number | null;
}

export interface ProjectExpenseSummary {
  projectId: number;
  expensesTotal: number;
  wagesTotal: number;
  transportationTotal: number;
  grandTotal: number;
}
