export interface VehicleMaintenanceLogListItem {
  id: number;
  vehicleId: number;
  vehicleName: string;
  vehicleNumberPlate: string;
  date: string;
  remarks: string | null;
  partsCostTotal: number;
  wagesCostTotal: number;
  totalCost: number;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateVehicleMaintenanceLogRequest {
  vehicleId: number;
  date: string;
  remarks: string | null;
}

export interface UpdateVehicleMaintenanceLogRequest {
  vehicleId: number;
  date: string;
  remarks: string | null;
}

export interface VehicleMaintenancePartListItem {
  id: number;
  maintenanceLogId: number;
  maintenancePartId: number;
  partName: string;
  quantity: number | null;
  unitCost: number | null;
  totalCost: number | null;
  remarks: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateVehicleMaintenancePartRequest {
  maintenanceLogId: number;
  maintenancePartId: number;
  quantity: number | null;
  unitCost: number | null;
  remarks: string | null;
}

export interface UpdateVehicleMaintenancePartRequest {
  maintenancePartId: number;
  quantity: number | null;
  unitCost: number | null;
  remarks: string | null;
}

export interface VehicleMaintenanceWageListItem {
  id: number;
  maintenanceLogId: number;
  numberOfWorkers: number;
  rate: number;
  totalAmount: number;
  remarks: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateVehicleMaintenanceWageRequest {
  maintenanceLogId: number;
  numberOfWorkers: number;
  rate: number;
  remarks: string | null;
}

export interface UpdateVehicleMaintenanceWageRequest {
  numberOfWorkers: number;
  rate: number;
  remarks: string | null;
}
