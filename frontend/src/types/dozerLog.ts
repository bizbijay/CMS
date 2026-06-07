export interface DozerLogListItem {
  id: number;
  driverId: number;
  driverName: string;
  vehicleId: number | null;
  vehicleName: string | null;
  operationDate: string;
  operatedTimeMs: number;
  projectId: number | null;
  projectName: string;
  projectOther: string | null;
}

export interface CreateDozerLogRequest {
  driverId: number;
  vehicleId: number | null;
  operationDate: string;
  operatedTimeMs: number;
  projectId: number | null;
  projectOther: string | null;
}

export interface UpdateDozerLogRequest {
  driverId: number;
  vehicleId: number | null;
  operationDate: string;
  operatedTimeMs: number;
  projectId: number | null;
  projectOther: string | null;
}
