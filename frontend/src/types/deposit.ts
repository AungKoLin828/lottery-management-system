export type PaymentMethod =
  | "KBZPay"
  | "WavePay"
  | "AYA Pay"
  | "Bank Transfer"
  | "Other";

export interface DepositRequest {
  id: number;

  playerId: string;

  playerName: string;

  phone: string;

  requestedAmount: number;

  paymentMethod: string;

  transactionNumber: string;

  status: "Pending" | "Approved" | "Rejected";

  createdAt: string;
}
