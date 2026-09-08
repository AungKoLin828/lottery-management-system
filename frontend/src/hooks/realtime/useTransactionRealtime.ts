import { useEffect } from "react";

import type { RealtimeChannel } from "@supabase/supabase-js";

import {
  removeRealtimeChannel,
  subscribeToPostgresChanges,
} from "@/services/realtime/realtimeManager";

interface TransactionRealtimeOptions {
  userId: string | null;

  onChanged?: () => void;
}

export function useTransactionRealtime({
  userId,
  onChanged,
}: TransactionRealtimeOptions): void {
  useEffect(() => {
    if (!userId) {
      return;
    }

    let channel: RealtimeChannel | null = null;

    channel = subscribeToPostgresChanges({
      channelName: `transactions:${userId}`,

      table: "transactions",

      event: "*",

      filter: `user_id=eq.${userId}`,

      onEvent: () => {
        onChanged?.();
      },
    });

    return () => {
      void removeRealtimeChannel(channel);
    };
  }, [userId, onChanged]);
}
