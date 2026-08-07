export interface PartyNameListItem {
  id: number;
  name: string;
  totalBalance?: number;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreatePartyNameRequest {
  name: string;
}

export interface UpdatePartyNameRequest {
  name: string;
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
