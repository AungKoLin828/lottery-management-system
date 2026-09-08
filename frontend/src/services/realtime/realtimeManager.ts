import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

export type RealtimeEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

export interface RealtimeSubscriptionOptions<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  channelName: string;

  table: string;

  event?: RealtimeEvent;

  filter?: string;

  onInsert?: (record: T) => void;

  onUpdate?: (record: T, oldRecord: T) => void;

  onDelete?: (record: T) => void;

  onEvent?: (payload: RealtimePostgresChangesPayload<T>) => void;
}

export function subscribeToPostgresChanges<T extends Record<string, unknown>>({
  channelName,
  table,
  event = "*",
  filter,
  onInsert,
  onUpdate,
  onDelete,
  onEvent,
}: RealtimeSubscriptionOptions<T>): RealtimeChannel {
  const channel = supabase.channel(channelName);

  channel.on(
    "postgres_changes",
    {
      event,

      schema: "public",

      table,

      ...(filter
        ? {
            filter,
          }
        : {}),
    },
    (payload) => {
      const typedPayload = payload as RealtimePostgresChangesPayload<T>;

      onEvent?.(typedPayload);

      switch (payload.eventType) {
        case "INSERT":
          onInsert?.(payload.new as T);
          break;

        case "UPDATE":
          onUpdate?.(payload.new as T, payload.old as T);
          break;

        case "DELETE":
          onDelete?.(payload.old as T);
          break;
      }
    },
  );

  void channel.subscribe((status, error) => {
    if (error) {
      console.error(`[Realtime] ${channelName} error:`, error);

      return;
    }

    console.log(`[Realtime] ${channelName}: ${status}`);
  });

  return channel;
}

export async function removeRealtimeChannel(
  channel: RealtimeChannel | null,
): Promise<void> {
  if (!channel) {
    return;
  }

  try {
    await supabase.removeChannel(channel);
  } catch (error) {
    console.error("[Realtime] Failed to remove channel:", error);
  }
}

export async function removeAllRealtimeChannels(): Promise<void> {
  try {
    await supabase.removeAllChannels();
  } catch (error) {
    console.error("[Realtime] Failed to remove channels:", error);
  }
}
