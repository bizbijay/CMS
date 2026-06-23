export interface ProjectExpenseListItem {
  id: number;
  projectId: number;
  projectName: string;
  materialId?: number | null;
  materialName?: string | null;
  quantity?: number | null;
  costPerUnit?: number | null;
  totalCost?: number | null;
  vendorId?: number | null;
  vendorName?: string | null;
  vendorOther?: string | null;
  date: string;
  remarks?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateProjectExpenseRequest {
  projectId: number;
  materialId?: number | null;
  quantity?: number | null;
  costPerUnit?: number | null;
  vendorId?: number | null;
  vendorOther?: string | null;
  date: string;
  remarks?: string | null;
}

export interface UpdateProjectExpenseRequest {
  materialId?: number | null;
  quantity?: number | null;
  costPerUnit?: number | null;
  vendorId?: number | null;
  vendorOther?: string | null;
  date: string;
  remarks?: string | null;
}
