export interface PermissionListItem {
  id: number;
  name: string;
  description?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreatePermissionRequest {
  name: string;
  description?: string | null;
}

export interface UpdatePermissionRequest {
  name: string;
  description?: string | null;
}
