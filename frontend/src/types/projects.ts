export interface ProjectListItem {
  id: number;
  name: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateProjectRequest {
  name: string;
}

export interface UpdateProjectRequest {
  name: string;
}

export interface ProjectExpenseSummary {
  projectId: number;
  expensesTotal: number;
  wagesTotal: number;
  transportationTotal: number;
  grandTotal: number;
}
