import { useCallback } from "react";

import {
  useWalletRealtime,
  useDepositRealtime,
  useWithdrawalRealtime,
  useTransactionRealtime,
} from "@/hooks/realtime";

interface UsePlayerRealtimeOptions {
  userId: string | null;

  onWalletChanged?: () => void;

  onDepositChanged?: () => void;

  onWithdrawalChanged?: () => void;

  onTransactionChanged?: () => void;
}

export function usePlayerRealtime({
  userId,
  onWalletChanged,
  onDepositChanged,
  onWithdrawalChanged,
  onTransactionChanged,
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

  const handleTransactionChanged = useCallback(() => {
    onTransactionChanged?.();
  }, [onTransactionChanged]);

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

  useTransactionRealtime({
    userId,
    onChanged: handleTransactionChanged,
  });
}
