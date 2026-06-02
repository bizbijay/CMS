export interface TransportationListItem {
  id: number;
  transportedById: number;
  transportedByName: string;
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
  vendorId?: number | null;
  vendorOther?: string | null;
  projectId?: number | null;
  projectOther?: string | null;
  date: string;
}

export interface UpdateTransportationRequest {
  transportedById: number;
  vendorId?: number | null;
  vendorOther?: string | null;
  projectId?: number | null;
  projectOther?: string | null;
  date: string;
}
