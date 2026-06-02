export interface FuelListItem {
  id: number;
  name: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateFuelRequest {
  name: string;
}

export interface UpdateFuelRequest {
  name: string;
}
