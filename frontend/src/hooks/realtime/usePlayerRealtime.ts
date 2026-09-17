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

export function usePlayerRealtime({
  userId,
  onWalletChanged,
  onDepositChanged,
  onWithdrawalChanged,
}: UsePlayerRealtimeOptions): void {
  const handleWalletChanged = useCallback(() => {
    onWalletChanged?.();
  }, [onWalletChanged]);

  const handleDepositChanged = useCallback(() => {
    onDepositChanged?.();
  }, [onDepositChanged]);

  const handleWithdrawalChanged = useCallback(() => {
    onWithdrawalChanged?.();
  }, [onWithdrawalChanged]);

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
