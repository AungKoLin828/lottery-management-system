import { useCallback } from "react";

import {
  useWalletRealtime,
  useDepositRealtime,
  useWithdrawalRealtime,
} from "@/hooks/realtime";

interface UsePlayerRealtimeOptions {
  userId: string | null;

  onWalletChanged?: () => void;

  onDepositChanged?: () => void;

  onWithdrawalChanged?: () => void;
}

/* ============================================================
   PLAYER REALTIME
============================================================ */

export function usePlayerRealtime({
  userId,
  onWalletChanged,
  onDepositChanged,
  onWithdrawalChanged,
}: UsePlayerRealtimeOptions): void {
  /* ==========================================================
     WALLET
  ========================================================== */

  const handleWalletChanged = useCallback(() => {
    onWalletChanged?.();
  }, [onWalletChanged]);

  /* ==========================================================
     DEPOSIT
  ========================================================== */

  const handleDepositChanged = useCallback(() => {
    onDepositChanged?.();
  }, [onDepositChanged]);

  /* ==========================================================
     WITHDRAWAL
  ========================================================== */

  const handleWithdrawalChanged = useCallback(() => {
    onWithdrawalChanged?.();
  }, [onWithdrawalChanged]);

  /* ==========================================================
     SUBSCRIPTIONS
  ========================================================== */

  useWalletRealtime({
    userId,
    onChanged: handleWalletChanged,
  });

  useDepositRealtime({
    userId,
    onChanged: handleDepositChanged,
  });

  useWithdrawalRealtime({
    userId,
    onChanged: handleWithdrawalChanged,
  });
}