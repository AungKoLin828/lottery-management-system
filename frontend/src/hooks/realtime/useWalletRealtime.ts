import { useEffect } from "react";

import type { RealtimeChannel } from "@supabase/supabase-js";

import {
  removeRealtimeChannel,
  subscribeToPostgresChanges,
} from "@/services/realtime/realtimeManager";

interface WalletRealtimeOptions {
  userId: string | null;

  onChanged?: () => void;
}

export function useWalletRealtime({
  userId,
  onChanged,
}: WalletRealtimeOptions): void {
  useEffect(() => {
    if (!userId) {
      return;
    }

    let channel: RealtimeChannel | null = null;

    channel = subscribeToPostgresChanges({
      channelName: `wallet:${userId}`,

      table: "wallets",

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
