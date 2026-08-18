export interface DozerLogListItem {
  id: number;
  driverId: number;
  driverName: string;
  vehicleId: number | null;
  vehicleName: string | null;
  operationDate: string;
  operatedTimeMs: number | null;
  startMeter: number;
  endMeter: number;
  totalMeterRun: number;
  projectId: number | null;
  projectName: string;
  projectOther: string | null;
  wages: number | null;
  partyNameId?: number | null;
  partyNameName?: string | null;
  location?: string | null;
  paymentType?: string | null;
  cashAmount?: number | null;
  workOrderBy?: string | null;
}

export interface CreateDozerLogRequest {
  driverId: number;
  vehicleId: number | null;
  operationDate: string;
  startMeter: number;
  endMeter: number;
  projectId: number | null;
  projectOther: string | null;
  wages: number | null;
  partyNameId?: number | null;
  location?: string | null;
  paymentType?: string | null;
  cashAmount?: number | null;
  workOrderBy?: string | null;
}

export interface UpdateDozerLogRequest {
  driverId: number;
  vehicleId: number | null;
  operationDate: string;
  startMeter: number;
  endMeter: number;
  projectId: number | null;
  projectOther: string | null;
  wages: number | null;
  partyNameId?: number | null;
  location?: string | null;
  paymentType?: string | null;
  cashAmount?: number | null;
  workOrderBy?: string | null;
}

export interface DozerLogQueryParams {
  pageNumber?: number;
  pageSize?: number;
  driverId?: number;
  vehicleId?: number;
  driverName?: string;
  vehicleName?: string;
  sortBy?: string;
  sortDescending?: boolean;
}

