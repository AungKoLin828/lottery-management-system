/* ============================================================
   GENERAL SETTINGS
============================================================ */

export interface GeneralSettings {
  systemName: string;

  currency: string;

  timeZone: string;

  language: string;

  logo: string;

  favicon: string;

  contactPhone: string;

  contactEmail: string;

  address: string;

  facebook: string;

  telegram: string;

  viber: string;

  announcement: string;
}

/* ============================================================
   PAYMENT METHOD
============================================================ */

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

/* ============================================================
   DEPOSIT SETTINGS
============================================================ */

export interface DepositSettings {
  minimumDeposit: number;

  maximumDeposit: number;

  autoApproval: boolean;

  manualApproval: boolean;

  allowedPaymentMethods: number[];

  depositNote: string;

  dailyDepositLimit: number;

  processingTime: string;
}

/* ============================================================
   WITHDRAW SETTINGS
============================================================ */

export interface WithdrawSettings {
  minimumWithdraw: number;

  maximumWithdraw: number;

  dailyWithdrawLimit: number;

  approvalRequired: boolean;

  allowedPaymentMethods: number[];

  withdrawFee: number;

  processingTime: string;

  autoWithdraw: boolean;
}

/* ============================================================
   MAINTENANCE SETTINGS
============================================================ */

export interface MaintenanceSettings {
  maintenanceMode: boolean;

  maintenanceMessage: string;

  allowAdminLogin: boolean;

  disablePlayerLogin: boolean;

  disableTicketPurchase: boolean;

  disableDeposit: boolean;

  disableWithdraw: boolean;

  scheduledStart: string;

  scheduledEnd: string;
}
