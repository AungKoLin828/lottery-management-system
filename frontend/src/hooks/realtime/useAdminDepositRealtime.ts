import { useEffect } from "react";

import type {
  RealtimeChannel,
  RealtimePostgresInsertPayload,
} from "@supabase/supabase-js";

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
        console.log("[Admin Realtime] New deposit request received:", payload);

        /*
         * The subscription is configured for INSERT events.
         *
         * Supabase Realtime provides the newly inserted
         * database record in payload.new.
         */
        const insertPayload = payload as RealtimePostgresInsertPayload<
          Record<string, unknown>
        >;

        const deposit = insertPayload.new as AdminDepositRequest;

        if (!deposit || typeof deposit !== "object") {
          return;
        }

        /*
         * Make sure the record contains the required
         * deposit ID before notifying the admin UI.
         */
        if (typeof deposit.id !== "string" || !deposit.id) {
          console.warn(
            "[Admin Realtime] Received deposit without a valid ID:",
            deposit,
          );

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
