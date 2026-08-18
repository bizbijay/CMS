export interface FuelLogListItem {
  id: number;
  driverId: number;
  driverName: string;
  vehicleId: number;
  vehicleName: string;
  partyNameId?: number | null;
  partyNameName?: string | null;
  partyNameOther?: string | null;
  fuelTypeId: number;
  fuelTypeName: string;
  quantity: number;
  price: number;
  date: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateFuelLogRequest {
  driverId: number;
  vehicleId: number;
  partyNameId?: number | null;
  partyNameOther?: string | null;
  fuelTypeId: number;
  quantity: number;
  price: number;
  date: string;
}

export interface UpdateFuelLogRequest {
  driverId: number;
  vehicleId: number;
  partyNameId?: number | null;
  partyNameOther?: string | null;
  fuelTypeId: number;
  quantity: number;
  price: number;
  date: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface FuelLogQueryParams {
  pageNumber?: number;
  pageSize?: number;
  driverName?: string;
  vehicleName?: string;
  driverId?: number;
  sortBy?: string;
  sortDescending?: boolean;
}

