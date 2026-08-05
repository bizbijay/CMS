export interface BankAccountListItem {
  id: number;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  branch?: string | null;
  isPrimary: boolean;
  totalBalance?: number;
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

export interface BankAccountBalanceSummary {
  bankAccountId: number;
  totalBalance: number;
}

export interface BankAccountCreditLogListItem {
  id: number;
  bankAccountId: number;
  amount: number;
  loggedOn: string;
  remarks?: string | null;
  createdAt: string;
  createdBy?: string | null;
}

export interface AddBankAccountBalanceRequest {
  amount: number;
  loggedOn?: string | null;
  remarks?: string | null;
}
