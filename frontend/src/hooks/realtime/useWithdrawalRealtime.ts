import { useEffect } from "react";

import type { RealtimeChannel } from "@supabase/supabase-js";

import {
  removeRealtimeChannel,
  subscribeToPostgresChanges,
} from "@/services/realtime/realtimeManager";

interface WithdrawalRealtimeOptions {
  userId: string | null;

  onChanged?: () => void;
}

export function useWithdrawalRealtime({
  userId,
  onChanged,
}: WithdrawalRealtimeOptions): void {
  useEffect(() => {
    if (!userId) {
      return;
    }

    let channel: RealtimeChannel | null = null;

    channel = subscribeToPostgresChanges({
      channelName: `withdrawals:${userId}`,

      table: "withdrawals",

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
