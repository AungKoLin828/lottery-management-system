import { useEffect } from "react";

import type { RealtimeChannel } from "@supabase/supabase-js";

import {
  removeRealtimeChannel,
  subscribeToPostgresChanges,
} from "@/services/realtime/realtimeManager";

interface LotteryResultRealtimeOptions {
  onChanged?: () => void;
}

export function useLotteryResultRealtime({
  onChanged,
}: LotteryResultRealtimeOptions): void {
  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    channel = subscribeToPostgresChanges({
      channelName: "lottery-results:public",

      table: "lottery_results",

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
