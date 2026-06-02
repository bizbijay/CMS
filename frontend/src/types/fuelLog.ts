export interface FuelLogListItem {
  id: number;
  driverId: number;
  driverName: string;
  vehicleId: number;
  vehicleName: string;
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
  fuelTypeId: number;
  quantity: number;
  price: number;
  date: string;
}

export interface UpdateFuelLogRequest {
  driverId: number;
  vehicleId: number;
  fuelTypeId: number;
  quantity: number;
  price: number;
  date: string;
}
