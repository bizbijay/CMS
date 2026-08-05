export interface BankAccountListItem {
  id: number;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  branch?: string | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export interface CreateBankAccountRequest {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  branch?: string | null;
  isPrimary: boolean;
}

export interface UpdateBankAccountRequest {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  branch?: string | null;
  isPrimary: boolean;
}
