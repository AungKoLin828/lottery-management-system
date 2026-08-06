export interface WithdrawRequest {
  id: number;

  playerId: string;

  playerName: string;

  phone: string;

  requestedAmount: number;

  paymentMethod: string;

  accountNumber: string;

  status: "Pending" | "Approved" | "Rejected";

  createdAt: string;
}
