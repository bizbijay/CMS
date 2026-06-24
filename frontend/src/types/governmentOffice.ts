export interface GovernmentOfficeListItem {
  id: number;
  name: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateGovernmentOfficeRequest {
  name: string;
}

export interface UpdateGovernmentOfficeRequest {
  name: string;
}
