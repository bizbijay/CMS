export interface TransportationListItem {
  id: number;
  transportedById?: number | null;
  transportedByName: string;
  transportedByOther?: string | null;
  vehicleId?: number | null;
  vehicleName?: string | null;
  vehicleOther?: string | null;
  materialId?: number | null;
  materialName?: string | null;
  vendorId?: number | null;
  vendorName: string;
  vendorOther?: string | null;
  projectId?: number | null;
  projectName: string;
  projectOther?: string | null;
  quantity?: number | null;
  perUnitCost?: number | null;
  materialCost?: number | null;
  tax?: number | null;
  wages?: number | null;
  date: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateTransportationRequest {
  transportedById?: number | null;
  transportedByOther?: string | null;
  vehicleId?: number | null;
  vehicleOther?: string | null;
  materialId?: number | null;
  vendorId?: number | null;
  vendorOther?: string | null;
  projectId?: number | null;
  projectOther?: string | null;
  quantity?: number | null;
  perUnitCost?: number | null;
  tax?: number | null;
  wages?: number | null;
  date: string;
}

export interface UpdateTransportationRequest {
  transportedById?: number | null;
  transportedByOther?: string | null;
  vehicleId?: number | null;
  vehicleOther?: string | null;
  materialId?: number | null;
  vendorId?: number | null;
  vendorOther?: string | null;
  projectId?: number | null;
  projectOther?: string | null;
  quantity?: number | null;
  perUnitCost?: number | null;
  tax?: number | null;
  wages?: number | null;
  date: string;
}
