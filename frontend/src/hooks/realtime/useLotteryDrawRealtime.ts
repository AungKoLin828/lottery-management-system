import { useEffect } from "react";

import type { RealtimeChannel } from "@supabase/supabase-js";

import {
  removeRealtimeChannel,
  subscribeToPostgresChanges,
} from "@/services/realtime/realtimeManager";

interface LotteryDrawRealtimeOptions {
  onChanged?: () => void;
}

export function useLotteryDrawRealtime({
  onChanged,
}: LotteryDrawRealtimeOptions): void {
  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    channel = subscribeToPostgresChanges({
      channelName: "lottery-draws:public",

      table: "lottery_draws",

      event: "*",

      onEvent: () => {
        onChanged?.();
      },
    });

    return () => {
      void removeRealtimeChannel(channel);
    };
  }, [onChanged]);
}
