import type { DepositRequest, WithdrawRequest } from "@/types/wallet";

const DEPOSIT_KEY = "lottery_deposit_requests";
const WITHDRAW_KEY = "lottery_withdraw_requests";

function readStorage<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);

    if (!data) {
      return [];
    }

    return JSON.parse(data) as T[];
  } catch (error) {
    console.error(`Failed to read ${key}:`, error);

    return [];
  }
}

function writeStorage<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

/*
 * ============================================================
 * DEPOSIT
 * ============================================================
 */

export function getDepositRequests(): DepositRequest[] {
  return readStorage<DepositRequest>(DEPOSIT_KEY);
}

export function createDepositRequest(request: DepositRequest): DepositRequest {
  const requests = getDepositRequests();

  writeStorage(DEPOSIT_KEY, [request, ...requests]);

  return request;
}

/*
 * ============================================================
 * WITHDRAW
 * ============================================================
 */

export function getWithdrawRequests(): WithdrawRequest[] {
  return readStorage<WithdrawRequest>(WITHDRAW_KEY);
}

export function createWithdrawRequest(
  request: WithdrawRequest,
): WithdrawRequest {
  const requests = getWithdrawRequests();

  writeStorage(WITHDRAW_KEY, [request, ...requests]);

  return request;
}
