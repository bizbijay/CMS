export type PartyNameType = "petrol_pump" | "other";

export interface PartyNameListItem {
  id: number;
  name: string;
  type?: PartyNameType | string | null;
  address?: string | null;
  totalBalance?: number;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreatePartyNameRequest {
  name: string;
  type: PartyNameType;
  address?: string | null;
}

export interface UpdatePartyNameRequest {
  name: string;
  type: PartyNameType;
  address?: string | null;
}

export interface PartyBalanceLogListItem {
  id: number;
  partyNameId: number;
  entryType: "credit" | "debit";
  amount: number;
  loggedOn: string;
  remarks?: string | null;
  createdAt: string;
  createdBy?: string | null;
}

export interface AddPartyBalanceRequest {
  amount: number;
  loggedOn?: string | null;
  remarks?: string | null;
}

export interface ReceivePartyAmountRequest {
  amount: number;
  receivedOn?: string | null;
  remarks?: string | null;
}
