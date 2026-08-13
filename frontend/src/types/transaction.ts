export interface Transaction {
  id: number;

  playerId: string;

  playerName: string;

  type:
    | "Deposit"
    | "Withdraw"
    | "Adjustment"
    | "Reject Deposit"
    | "Reject Withdraw";

  amount: number;

  paymentMethod?: string;

  transactionNumber?: string;

  note: string;

  createdBy: string;

  createdAt: string;
}
