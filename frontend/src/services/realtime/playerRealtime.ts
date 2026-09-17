import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

export interface WalletRealtimeRecord {
  id: string;
  user_id: string;
  balance: string | number;
  total_deposit?: string | number;
  total_withdraw?: string | number;
  total_bet?: string | number;
  total_win?: string | number;
  [key: string]: unknown;
}

export interface DepositRealtimeRecord {
  id: string;
  user_id: string;
  status: string;
  amount?: string | number;
  [key: string]: unknown;
}

export interface WithdrawalRealtimeRecord {
  id: string;
  user_id: string;
  status: string;
  amount?: string | number;
  [key: string]: unknown;
}

export interface PlayerRealtimeHandlers {
  onWalletUpdate?: (
    record: WalletRealtimeRecord,
    oldRecord: WalletRealtimeRecord,
  ) => void;

  onDepositUpdate?: (
    record: DepositRealtimeRecord,
    oldRecord: DepositRealtimeRecord,
  ) => void;

  onWithdrawalUpdate?: (
    record: WithdrawalRealtimeRecord,
    oldRecord: WithdrawalRealtimeRecord,
  ) => void;

  onError?: (error: unknown) => void;
}

export interface PlayerRealtimeSubscriptions {
  walletChannel: RealtimeChannel;
  depositChannel: RealtimeChannel;
  withdrawalChannel: RealtimeChannel;
}

export function subscribeToPlayerRealtime(
  userId: string,
  handlers: PlayerRealtimeHandlers = {},
): PlayerRealtimeSubscriptions {
  /*
   * Wallet
   *
   * Only listen to this player's wallet.
   */
  const walletChannel = supabase
    .channel(`player-wallet-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "wallets",
        filter: `user_id=eq.${userId}`,
      },
      (payload: RealtimePostgresChangesPayload<WalletRealtimeRecord>) => {
        console.log("[Realtime] Wallet updated");

        handlers.onWalletUpdate?.(
          payload.new as WalletRealtimeRecord,
          payload.old as WalletRealtimeRecord,
        );
      },
    )
    .subscribe((status, error) => {
      if (error) {
        console.error("[Realtime] Wallet subscription error:", error);

        handlers.onError?.(error);
        return;
      }

      console.log(`[Realtime] Wallet subscription: ${status}`);
    });

  /*
   * Deposit
   *
   * Only listen to this player's deposits.
   */
  const depositChannel = supabase
    .channel(`player-deposit-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "deposits",
        filter: `user_id=eq.${userId}`,
      },
      (payload: RealtimePostgresChangesPayload<DepositRealtimeRecord>) => {
        console.log("[Realtime] Deposit updated");

        handlers.onDepositUpdate?.(
          payload.new as DepositRealtimeRecord,
          payload.old as DepositRealtimeRecord,
        );
      },
    )
    .subscribe((status, error) => {
      if (error) {
        console.error("[Realtime] Deposit subscription error:", error);

        handlers.onError?.(error);
        return;
      }

      console.log(`[Realtime] Deposit subscription: ${status}`);
    });

  /*
   * Withdrawal
   *
   * Only listen to this player's withdrawals.
   */
  const withdrawalChannel = supabase
    .channel(`player-withdrawal-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "withdrawals",
        filter: `user_id=eq.${userId}`,
      },
      (payload: RealtimePostgresChangesPayload<WithdrawalRealtimeRecord>) => {
        console.log("[Realtime] Withdrawal updated");

        handlers.onWithdrawalUpdate?.(
          payload.new as WithdrawalRealtimeRecord,
          payload.old as WithdrawalRealtimeRecord,
        );
      },
    )
    .subscribe((status, error) => {
      if (error) {
        console.error("[Realtime] Withdrawal subscription error:", error);

        handlers.onError?.(error);
        return;
      }

      console.log(`[Realtime] Withdrawal subscription: ${status}`);
    });

  return {
    walletChannel,
    depositChannel,
    withdrawalChannel,
  };
}

export async function unsubscribeFromPlayerRealtime(
  subscriptions: PlayerRealtimeSubscriptions | null,
): Promise<void> {
  if (!subscriptions) {
    return;
  }

  await Promise.all([
    supabase.removeChannel(subscriptions.walletChannel),
    supabase.removeChannel(subscriptions.depositChannel),
    supabase.removeChannel(subscriptions.withdrawalChannel),
  ]);

  console.log("[Realtime] Player subscriptions removed");
}
