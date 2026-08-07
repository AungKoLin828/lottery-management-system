export interface SystemSettings {
  id: number;

  systemName: string;

  currency: string;

  phone: string;

  email: string;

  address: string;

  minDeposit: number;

  maxDeposit: number;

  minWithdraw: number;

  maxWithdraw: number;

  maintenanceMode: boolean;

  announcement: string;
}
