export interface PartyNameListItem {
  id: number;
  name: string;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreatePartyNameRequest {
  name: string;
}

export interface UpdatePartyNameRequest {
  name: string;
}
