export interface ProjectCommissionListItem {
  id: number;
  projectId: number;
  officeId: number | null;
  officeName: string | null;
  otherOption: string | null;
  amount: number;
  remarks: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateProjectCommissionRequest {
  projectId: number;
  officeId: number | null;
  otherOption: string | null;
  amount: number;
  remarks: string | null;
}

export interface UpdateProjectCommissionRequest {
  officeId: number | null;
  otherOption: string | null;
  amount: number;
  remarks: string | null;
}
