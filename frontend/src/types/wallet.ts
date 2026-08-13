export interface Wallet {
  id: number;
  playerId: string;
  playerName: string;
  phone: string;
  balance: number;
}

export type WalletRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface DepositRequest {
  id: string;
  playerId: string;
  playerName: string;
  amount: number;
  paymentMethodId: number;
  paymentMethodName: string;
  transactionNumber: string;
  note?: string;
  status: WalletRequestStatus;
  createdAt: string;
}

export interface WithdrawRequest {
  id: string;
  playerId: string;
  playerName: string;
  amount: number;
  fee: number;
  netAmount: number;
  paymentMethodId: number;
  paymentMethodName: string;
  accountName: string;
  accountNumber: string;
  note?: string;
  status: WalletRequestStatus;
  createdAt: string;
}
