export type PaymentMethodType = "Deposit" | "Withdraw" | "Both";

export interface PaymentMethod {
  id: string;

  name: string;

  type: PaymentMethodType;

  enabled: boolean;

  accountName: string;

  accountNumber: string;

  bankName: string;

  branch: string;

  displayOrder: number;

  createdAt?: string;

  updatedAt?: string;
}
