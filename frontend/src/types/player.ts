// src/types/player.ts

export type Session2D = "AM" | "PM";

export interface Bet2D {
  id: string;
  number: string;
  amount: number;
  session: Session2D;
}

export interface Bet3D {
  id: string;
  number: string;
  amount: number;
}

export interface Ticket {
  id: string;
  type: "2D" | "3D";
  date: string;
  totalAmount: number;
  status: "Pending" | "Won" | "Lost";
}

export interface WalletData {
  balance: number;
  totalDeposit: number;
  totalWithdraw: number;
}
