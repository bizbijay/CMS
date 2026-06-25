export interface MaintenancePartListItem {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateMaintenancePartRequest {
  name: string;
}

export interface UpdateMaintenancePartRequest {
  name: string;
}
