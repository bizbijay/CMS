export interface VendorListItem {
  id: number;
  name: string;
  panNumber?: string | null;
  totalBalance?: number;
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

export interface VendorBalanceLogListItem {
  id: number;
  vendorId: number;
  bankAccountId?: number | null;
  bankAccountName?: string | null;
  entryType: "credit" | "debit";
  amount: number;
  loggedOn: string;
  remarks?: string | null;
  createdAt: string;
  createdBy?: string | null;
}

export interface AddVendorBalanceRequest {
  amount: number;
  loggedOn?: string | null;
  remarks?: string | null;
}

export interface PayVendorAmountRequest {
  amount: number;
  bankAccountId: number;
  paidOn?: string | null;
  remarks?: string | null;
}
