export interface MaterialListItem {
  id: number;
  name: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateMaterialRequest {
  name: string;
}

export interface UpdateMaterialRequest {
  name: string;
}
