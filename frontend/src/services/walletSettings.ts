import type { PaymentMethod } from "@/types/settings";

/*
 * ============================================================
 * TEMPORARY PLAYER WALLET SETTINGS
 * ============================================================
 *
 * Later these values should come from:
 *
 * Admin Settings
 *      ↓
 * API / Netlify Function
 *      ↓
 * Player Deposit / Withdraw
 *
 */

export const walletPaymentMethods: PaymentMethod[] = [
  {
    id: 1,
    name: "KBZPay",
    type: "Both",
    enabled: true,
    qrCode: "",
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
    qrCode: "",
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
    qrCode: "",
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
    qrCode: "",
    accountName: "Lottery Company",
    accountNumber: "1234567890",
    bankName: "KBZ Bank",
    branch: "Yangon Main Branch",
    displayOrder: 4,
  },
];

export const depositSettings = {
  minimumDeposit: 1000,
  maximumDeposit: 1000000,
  dailyDepositLimit: 5000000,
  processingTime: "5-15 minutes",

  autoApproval: false,
  manualApproval: true,

  allowedPaymentMethods: [1, 2, 3],

  depositNote: "Please make sure your transaction number is correct.",
};

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
