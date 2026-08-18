import type { PaymentMethod } from "@/types/settings";

/*
 * ============================================================
 * PLAYER WALLET PAYMENT METHODS
 * ============================================================
 *
 * qrCode:
 *   - Can contain a public image path
 *   - Example: "/payment-qr/kbzpay.png"
 *   - Or an external image URL
 *
 * accountNumber:
 *   - Phone number for KBZPay / WavePay / AYA Pay
 *   - Bank account number for bank transfer
 *
 */

export const walletPaymentMethods: PaymentMethod[] = [
  {
    id: 1,
    name: "KBZPay",
    type: "Both",
    enabled: true,
    logo: "/payment-logos/kbzpay.png",
    qrCode: "/payment-qr/kbzpay.png",
    accountName: "Lottery Admin",
    accountNumber: "09123456789",
    bankName: "",
    branch: "",
    displayOrder: 1,
  },

  {
    id: 2,
    name: "WavePay",
    type: "Deposit",
    enabled: true,
    logo: "/payment-logos/wavepay.png",
    qrCode: "/payment-qr/wavepay.png",
    accountName: "Lottery Admin",
    accountNumber: "09987654321",
    bankName: "",
    branch: "",
    displayOrder: 2,
  },

  {
    id: 3,
    name: "AYA Pay",
    type: "Both",
    enabled: false,
    logo: "/payment-logos/ayapay.png",
    qrCode: "/payment-qr/ayapay.png",
    accountName: "Lottery Admin",
    accountNumber: "09777777777",
    bankName: "",
    branch: "",
    displayOrder: 3,
  },

  {
    id: 4,
    name: "Bank Transfer",
    type: "Withdraw",
    enabled: true,
    logo: "/payment-logos/bank.png",
    qrCode: "",
    accountName: "Lottery Company",
    accountNumber: "1234567890",
    bankName: "KBZ Bank",
    branch: "Yangon Main Branch",
    displayOrder: 4,
  },
];

/*
 * ============================================================
 * DEPOSIT SETTINGS
 * ============================================================
 */

export const depositSettings = {
  minimumDeposit: 1000,

  maximumDeposit: 1000000,

  dailyDepositLimit: 5000000,

  processingTime: "5-15 minutes",

  autoApproval: false,

  manualApproval: true,

  /*
   * Payment methods allowed for deposit.
   */
  allowedPaymentMethods: [1, 2, 3],

  depositNote:
    "Please send the exact amount to the selected payment account and enter the last 6 digits of your transaction number correctly.",
};

/*
 * ============================================================
 * WITHDRAW SETTINGS
 * ============================================================
 */

export const withdrawSettings = {
  minimumWithdraw: 5000,

  maximumWithdraw: 500000,

  dailyWithdrawLimit: 1000000,

  approvalRequired: true,

  allowedPaymentMethods: [1, 4],

  withdrawFee: 0,

  processingTime: "10-30 minutes",

  autoWithdraw: false,
};
