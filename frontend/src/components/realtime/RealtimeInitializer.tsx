import { useEffect, useRef } from "react";

import {
  initializeRealtimeAuth,
  refreshRealtimeAuth,
  clearRealtimeAuth,
} from "@/services/realtime/realtimeAuth";

interface RealtimeInitializerProps {
  isAuthenticated: boolean;
}

/* ============================================================
   COMPONENT
============================================================ */

export default function RealtimeInitializer({
  isAuthenticated,
}: RealtimeInitializerProps) {
  const initializedRef = useRef(false);

  /* ==========================================================
     INITIALIZE
  ========================================================== */

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
      try {
        const success = await initializeRealtimeAuth();

        if (!cancelled && success) {
          initializedRef.current = true;
        }
      } catch (error) {
        /*
         * IMPORTANT:
         *
         * Realtime must NEVER break normal application
         * authentication or page rendering.
         */
        console.warn(
          "[Realtime] Initialization failed. Continuing without Realtime.",
          error,
        );
      }
    };

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  /* ==========================================================
     REFRESH TOKEN
  ========================================================== */

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const interval = window.setInterval(() => {
      void refreshRealtimeAuth().catch((error) => {
        console.warn(
          "[Realtime] Token refresh failed. Continuing without Realtime.",
          error,
        );
      });
    }, 8 * 60 * 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [isAuthenticated]);

  /* ==========================================================
     REFRESH WHEN TAB/PWA BECOMES VISIBLE
  ========================================================== */

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      void refreshRealtimeAuth().catch((error) => {
        console.warn(
          "[Realtime] Visibility refresh failed.",
          error,
        );
      });
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
  }, [isAuthenticated]);

  return null;
}