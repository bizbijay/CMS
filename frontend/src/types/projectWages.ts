export interface ProjectWageListItem {
  id: number;
  projectId: number;
  projectName: string;
  numberOfWorkers: number;
  rate: number;
  totalAmount: number;
  date: string;
  remarks?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateProjectWageRequest {
  projectId: number;
  numberOfWorkers: number;
  rate: number;
  date: string;
  remarks?: string | null;
}

export interface UpdateProjectWageRequest {
  numberOfWorkers: number;
  rate: number;
  date: string;
  remarks?: string | null;
}
