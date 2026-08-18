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
  id: number;

  name: string;

  type: PaymentMethodType;

  enabled: boolean;

  /*
   * Payment method logo
   *
   * Example:
   * /payment-logos/kbzpay.png
   * /payment-logos/wavepay.png
   * /payment-logos/ayapay.png
   *
   * Optional so existing payment methods
   * are not affected.
   */
  logo?: string;

  /*
   * Payment QR code
   *
   * Example:
   * /payment-qr/kbzpay.png
   */
  qrCode: string;

  accountName: string;

  accountNumber: string;

  bankName: string;

  branch: string;

  displayOrder: number;
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
