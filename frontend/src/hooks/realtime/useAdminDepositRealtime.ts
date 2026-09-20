import { useEffect } from "react";

import type {
  RealtimeChannel,
  RealtimePostgresInsertPayload,
} from "@supabase/supabase-js";

import {
  removeRealtimeChannel,
  subscribeToPostgresChanges,
} from "@/services/realtime/realtimeManager";

import type { AdminDepositRequest } from "@/services/adminDepositService";

/* ============================================================
   TYPES
============================================================ */

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
       * A new deposit request is created when the
       * player submits the deposit form.
       */
      event: "INSERT",

      onEvent: (payload) => {
        console.log("[Admin Realtime] New deposit request received:", payload);

        /*
         * Supabase Realtime provides the newly inserted
         * database record in payload.new.
         */
        const insertPayload = payload as RealtimePostgresInsertPayload<
          Record<string, unknown>
        >;

        const row = insertPayload.new;

        if (!row || typeof row !== "object") {
          return;
        }

        /*
         * Validate deposit ID.
         */
        if (typeof row.id !== "string" || !row.id) {
          console.warn(
            "[Admin Realtime] Received deposit without a valid ID:",
            row,
          );

          return;
        }

        /*
         * Convert the raw Supabase row to the same
         * AdminDepositRequest type used by
         * DepositRequests.tsx.
         *
         * Realtime gives us the deposits table row only.
         * Joined user/payment-method data is not available
         * here.
         */
        const deposit: AdminDepositRequest = {
          id: row.id,

          userId:
            typeof row.userId === "string"
              ? row.userId
              : typeof row.user_id === "string"
                ? row.user_id
                : "",

          requestedAmount:
            typeof row.requestedAmount === "string" ||
            typeof row.requestedAmount === "number"
              ? row.requestedAmount
              : typeof row.requested_amount === "string" ||
                  typeof row.requested_amount === "number"
                ? row.requested_amount
                : "0",

          approvedAmount:
            typeof row.approvedAmount === "string" ||
            typeof row.approvedAmount === "number"
              ? row.approvedAmount
              : typeof row.approved_amount === "string" ||
                  typeof row.approved_amount === "number"
                ? row.approved_amount
                : null,

          paymentMethodId:
            typeof row.paymentMethodId === "string"
              ? row.paymentMethodId
              : typeof row.payment_method_id === "string"
                ? row.payment_method_id
                : "",

          transactionNumber:
            typeof row.transactionNumber === "string"
              ? row.transactionNumber
              : typeof row.transaction_number === "string"
                ? row.transaction_number
                : null,

          status:
            row.status === "PENDING" ||
            row.status === "APPROVED" ||
            row.status === "REJECTED" ||
            row.status === "CANCELLED"
              ? row.status
              : "PENDING",

          note: typeof row.note === "string" ? row.note : null,

          rejectionReason:
            typeof row.rejectionReason === "string"
              ? row.rejectionReason
              : typeof row.rejection_reason === "string"
                ? row.rejection_reason
                : null,

          approvedBy:
            typeof row.approvedBy === "string"
              ? row.approvedBy
              : typeof row.approved_by === "string"
                ? row.approved_by
                : null,

          approvedAt:
            typeof row.approvedAt === "string"
              ? row.approvedAt
              : typeof row.approved_at === "string"
                ? row.approved_at
                : null,

          createdAt:
            typeof row.createdAt === "string"
              ? row.createdAt
              : typeof row.created_at === "string"
                ? row.created_at
                : undefined,

          updatedAt:
            typeof row.updatedAt === "string"
              ? row.updatedAt
              : typeof row.updated_at === "string"
                ? row.updated_at
                : undefined,
        };

        console.log("[Admin Realtime] Normalized deposit:", deposit);

        /*
         * Notify DepositRequests.tsx.
         */
        onNewDeposit?.(deposit);
      },
    });

    return () => {
      if (channel) {
        void removeRealtimeChannel(channel);
      }
    };
  }, [enabled, onNewDeposit]);
}
