import { useEffect } from "react";

import type { RealtimeChannel } from "@supabase/supabase-js";

import {
  removeRealtimeChannel,
  subscribeToPostgresChanges,
} from "@/services/realtime/realtimeManager";

interface AnnouncementRealtimeOptions {
  onChanged?: () => void;
}

export function useAnnouncementRealtime({
  onChanged,
}: AnnouncementRealtimeOptions): void {
  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    channel = subscribeToPostgresChanges({
      channelName: "announcements:public",

      table: "announcements",

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
