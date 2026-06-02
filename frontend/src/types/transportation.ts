export interface TransportationListItem {
  id: number;
  transportedById: number;
  transportedByName: string;
  vehicleId?: number | null;
  vehicleName?: string | null;
  materialId?: number | null;
  materialName?: string | null;
  vendorId?: number | null;
  vendorName: string;
  vendorOther?: string | null;
  projectId?: number | null;
  projectName: string;
  projectOther?: string | null;
  date: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateTransportationRequest {
  transportedById: number;
  vehicleId?: number | null;
  materialId?: number | null;
  vendorId?: number | null;
  vendorOther?: string | null;
  projectId?: number | null;
  projectOther?: string | null;
  date: string;
}

export interface UpdateTransportationRequest {
  transportedById: number;
  vehicleId?: number | null;
  materialId?: number | null;
  vendorId?: number | null;
  vendorOther?: string | null;
  projectId?: number | null;
  projectOther?: string | null;
  date: string;
}
