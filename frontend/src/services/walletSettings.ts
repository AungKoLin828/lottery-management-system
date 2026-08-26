import type { PaymentMethod } from "@/types/settings";

/*
 * ============================================================
 * PLAYER WALLET PAYMENT METHOD TYPE
 * ============================================================
 *
 * The shared PaymentMethod type is used by admin settings.
 *
 * Player wallet payment methods additionally need:
 *   - logo
 *
 * QR code has been completely removed.
 *
 * We also keep id as number because the current wallet settings
 * and allowedPaymentMethods use numeric IDs.
 */

export type WalletPaymentMethod = Omit<
  PaymentMethod,
  "id" | "logo" | "qrCode"
> & {
  id: number;
  logo?: string;
};

/*
 * ============================================================
 * PLAYER WALLET PAYMENT METHODS
 * ============================================================
 *
 * logo:
 *   - Public image path
 *   - Example: "/payment-logos/kbzpay.png"
 *
 * accountNumber:
 *   - Payment account / phone number for deposits
 *   - Admin's configured account is displayed for deposits
 *   - Withdrawal page asks the player for their own account
 *
 * QR CODE:
 *   - Removed completely.
 *   - No qrCode property is used anymore.
 */

export const walletPaymentMethods: WalletPaymentMethod[] = [
  {
    id: 1,

    name: "KBZPay",

    type: "Both",

    enabled: true,

    logo: "/payment-logos/kbzpay.png",

    accountName: "Lottery Admin",

    accountNumber: "09123456789",

    bankName: "",

    branch: "",

    displayOrder: 1,
  },

  {
    id: 2,

    name: "WavePay",

    type: "Both",

    enabled: true,

    logo: "/payment-logos/wavepay.png",

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
   *
   * 1 = KBZPay
   * 2 = WavePay
   * 3 = AYA Pay
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

  /*
   * Payment methods allowed for withdrawal.
   *
   * 1 = KBZPay
   * 2 = WavePay
   *
   * Bank Transfer is intentionally not available
   * on the player withdrawal page.
   */
  allowedPaymentMethods: [1, 2],

  withdrawFee: 0,

  processingTime: "10-30 minutes",

  autoWithdraw: false,
};
