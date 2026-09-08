import { useEffect } from "react";

import type { RealtimeChannel } from "@supabase/supabase-js";

import {
  removeRealtimeChannel,
  subscribeToPostgresChanges,
} from "@/services/realtime/realtimeManager";

interface DepositRealtimeOptions {
  userId: string | null;

  onChanged?: () => void;
}

export function useDepositRealtime({
  userId,
  onChanged,
}: DepositRealtimeOptions): void {
  useEffect(() => {
    if (!userId) {
      return;
    }

    let channel: RealtimeChannel | null = null;

    channel = subscribeToPostgresChanges({
      channelName: `deposits:${userId}`,

      table: "deposits",

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
