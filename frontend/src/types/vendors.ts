export interface VendorListItem {
  id: number;
  name: string;
  panNumber?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateVendorRequest {
  name: string;
  panNumber?: string;
}

export interface UpdateVendorRequest {
  name: string;
  panNumber?: string;
}
