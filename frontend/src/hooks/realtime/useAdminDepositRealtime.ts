import { useEffect } from "react";

import type { RealtimeChannel } from "@supabase/supabase-js";

import {
  removeRealtimeChannel,
  subscribeToPostgresChanges,
} from "@/services/realtime/realtimeManager";

/* ============================================================
   TYPES
============================================================ */

export interface AdminDepositRequest {
  id: string;
  userId?: string;
  amount?: string | number;
  status?: string;
  transactionNumber?: string;
  paymentMethodId?: string;
  note?: string | null;
  createdAt?: string;
  [key: string]: unknown;
}

interface AdminDepositRealtimeOptions {
  enabled?: boolean;

  onNewDeposit?: (deposit: AdminDepositRequest) => void;
}

/* ============================================================
   HOOK
============================================================ */

export function useAdminDepositRealtime({
  enabled = true,
  onNewDeposit,
}: AdminDepositRealtimeOptions): void {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    let channel: RealtimeChannel | null = null;

    channel = subscribeToPostgresChanges({
      /*
       * IMPORTANT:
       * Do NOT include user_id here.
       *
       * Admin needs to receive new deposit requests
       * from every player.
       */
      channelName: "admin-deposit-requests",

      table: "deposits",

      /*
       * We only need INSERT.
       *
       * A new deposit request is created when the player
       * submits the deposit form.
       */
      event: "INSERT",

      onEvent: (payload) => {
        console.log(
          "[Admin Realtime] New deposit request received:",
          payload,
        );

        /*
         * The realtime manager may return the complete
         * payload or only the database record depending
         * on its implementation.
         *
         * Support both forms safely.
         */
        const deposit =
          payload &&
          typeof payload === "object" &&
          "new" in payload
            ? (payload as { new: AdminDepositRequest }).new
            : (payload as AdminDepositRequest);

        if (!deposit || typeof deposit !== "object") {
          return;
        }

        onNewDeposit?.(deposit);
      },
    });

    return () => {
      void removeRealtimeChannel(channel);
    };
  }, [enabled, onNewDeposit]);
}