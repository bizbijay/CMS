export interface VendorListItem {
  id: number;
  name: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateVendorRequest {
  name: string;
}

export interface UpdateVendorRequest {
  name: string;
}
