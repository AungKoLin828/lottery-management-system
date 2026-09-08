import { useEffect, useRef } from "react";

import {
  initializeRealtimeAuth,
  refreshRealtimeAuth,
  clearRealtimeAuth,
} from "@/services/realtime/realtimeAuth";

interface RealtimeInitializerProps {
  isAuthenticated: boolean;
}

export default function RealtimeInitializer({
  isAuthenticated,
}: RealtimeInitializerProps) {
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      if (initializedRef.current) {
        clearRealtimeAuth();

        initializedRef.current = false;
      }

      return;
    }

    let cancelled = false;

    const initialize = async () => {
      const success = await initializeRealtimeAuth();

      if (!cancelled && success) {
        initializedRef.current = true;
      }
    };

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  /* ==========================================================
     REFRESH TOKEN BEFORE EXPIRATION
  ========================================================== */

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    /*
     * The server issues a 10-minute JWT.
     *
     * Refresh every 8 minutes so the WebSocket does not
     * reach the expiration point.
     */
    const interval = window.setInterval(
      () => {
        void refreshRealtimeAuth();
      },
      8 * 60 * 1000,
    );

    return () => {
      window.clearInterval(interval);
    };
  }, [isAuthenticated]);

  /* ==========================================================
     PWA / BROWSER VISIBILITY
  ========================================================== */

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshRealtimeAuth();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAuthenticated]);

  return null;
}
