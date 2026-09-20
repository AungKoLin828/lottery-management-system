import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  CreditCard,
  Eye,
  RefreshCw,
  Search,
  X,
  XCircle,
} from "lucide-react";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  approveAdminDeposit,
  getAdminDepositRequests,
  rejectAdminDeposit,
  type AdminDepositRequest,
} from "@/services/adminDepositService";

import { useAdminDepositRealtime } from "@/hooks/realtime/useAdminDepositRealtime";

/* ============================================================
   TYPES
============================================================ */

type DepositFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

/*
 * The backend returns flat fields such as:
 *
 * username
 * phone
 * paymentMethodName
 *
 * The frontend service may normalize them into:
 *
 * user
 * paymentMethod
 *
 * These optional fields allow this page to work with either
 * representation without changing the existing UI.
 */
type DepositRequestView = AdminDepositRequest & {
  username?: string | null;
  fullName?: string | null;
  phone?: string | null;
  paymentMethodName?: string | null;
};

/* ============================================================
   HELPERS
============================================================ */

function formatAmount(value: string | number | null | undefined): string {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount)) {
    return "0.00";
  }

  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(value: string | undefined | null): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getPlayerName(deposit: DepositRequestView): string {
  if (deposit.user?.fullName?.trim()) {
    return deposit.user.fullName;
  }

  if (deposit.user?.username?.trim()) {
    return deposit.user.username;
  }

  if (deposit.fullName?.trim()) {
    return deposit.fullName;
  }

  if (deposit.username?.trim()) {
    return deposit.username;
  }

  return deposit.userId;
}

function getPlayerUsername(deposit: DepositRequestView): string {
  if (deposit.user?.username?.trim()) {
    return deposit.user.username;
  }

  if (deposit.username?.trim()) {
    return deposit.username;
  }

  return "-";
}

function getPlayerPhone(deposit: DepositRequestView): string {
  if (deposit.user?.phone?.trim()) {
    return deposit.user.phone;
  }

  if (deposit.phone?.trim()) {
    return deposit.phone;
  }

  return "-";
}

function getPaymentMethodName(deposit: DepositRequestView): string {
  if (deposit.paymentMethod?.name?.trim()) {
    return deposit.paymentMethod.name;
  }

  if (deposit.paymentMethodName?.trim()) {
    return deposit.paymentMethodName;
  }

  return deposit.paymentMethodId;
}

function getStatusClass(status: string): string {
  switch (status) {
    case "APPROVED":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";

    case "REJECTED":
      return "bg-red-50 text-red-700 ring-red-600/20";

    case "CANCELLED":
      return "bg-slate-100 text-slate-600 ring-slate-500/20";

    default:
      return "bg-amber-50 text-amber-700 ring-amber-600/20";
  }
}

function getStatusIcon(status: string): ReactNode {
  switch (status) {
    case "APPROVED":
      return <CheckCircle2 className="h-3.5 w-3.5" />;

    case "REJECTED":
      return <XCircle className="h-3.5 w-3.5" />;

    case "CANCELLED":
      return <X className="h-3.5 w-3.5" />;

    default:
      return <Clock3 className="h-3.5 w-3.5" />;
  }
}

/* ============================================================
   COMPONENT
============================================================ */

export default function DepositRequests() {
  const [deposits, setDeposits] = useState<AdminDepositRequest[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<DepositFilter>("PENDING");

  const [search, setSearch] = useState("");

  const [selectedDeposit, setSelectedDeposit] =
    useState<AdminDepositRequest | null>(null);

  const [processingId, setProcessingId] = useState<string | null>(null);

  const [rejectReason, setRejectReason] = useState("");

  const [modal, setModal] = useState<"NONE" | "APPROVE" | "REJECT" | "VIEW">(
    "NONE",
  );

  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const [alertDeposit, setAlertDeposit] = useState<AdminDepositRequest | null>(
    null,
  );

  /* ==========================================================
     LOAD DATA
  ========================================================== */

  const loadDeposits = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError(null);

      const data = await getAdminDepositRequests();

      setDeposits(data);
    } catch (err) {
      console.error("Load admin deposit requests error:", err);

      setError(
        err instanceof Error ? err.message : "Failed to load deposit requests.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    void loadDeposits();
  }, [loadDeposits]);

  /* ==========================================================
     REALTIME NEW DEPOSIT
  ========================================================== */

  const handleNewDeposit = useCallback((deposit: AdminDepositRequest) => {
    console.log("[Admin UI] New deposit request:", deposit);

    setDeposits((current) => {
      const exists = current.some((item) => item.id === deposit.id);

      if (exists) {
        return current;
      }

      return [deposit, ...current];
    });

    const playerName = getPlayerName(deposit as DepositRequestView);

    setAlertDeposit(deposit);

    setAlertMessage(`New deposit request from ${playerName}`);

    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      try {
        new Notification("New Deposit Request", {
          body: `${playerName} requested ${formatAmount(
            deposit.requestedAmount,
          )}`,
        });
      } catch {
        // Browser notification is optional.
      }
    }

    window.setTimeout(() => {
      setAlertMessage(null);
      setAlertDeposit(null);
    }, 8000);
  }, []);

  useAdminDepositRealtime({
    enabled: true,
    onNewDeposit: handleNewDeposit,
  });

  /* ==========================================================
     SEARCH + FILTER
  ========================================================== */

  const filteredDeposits = useMemo(() => {
    const query = search.trim().toLowerCase();

    return deposits.filter((deposit) => {
      const viewDeposit = deposit as DepositRequestView;

      const matchesFilter = filter === "ALL" || deposit.status === filter;

      if (!matchesFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchable = [
        deposit.id,
        deposit.userId,

        viewDeposit.username,
        viewDeposit.fullName,
        viewDeposit.phone,
        viewDeposit.paymentMethodName,

        deposit.user?.username,
        deposit.user?.fullName,
        deposit.user?.phone,

        deposit.transactionNumber,
        deposit.paymentMethodId,
        deposit.paymentMethod?.name,

        deposit.note,
        deposit.rejectionReason,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [deposits, filter, search]);

  /* ==========================================================
     COUNTS
  ========================================================== */

  const pendingCount = deposits.filter(
    (item) => item.status === "PENDING",
  ).length;

  const approvedCount = deposits.filter(
    (item) => item.status === "APPROVED",
  ).length;

  const rejectedCount = deposits.filter(
    (item) => item.status === "REJECTED",
  ).length;

  const cancelledCount = deposits.filter(
    (item) => item.status === "CANCELLED",
  ).length;

  /* ==========================================================
     OPEN APPROVE
  ========================================================== */

  const openApprove = (deposit: AdminDepositRequest) => {
    setSelectedDeposit(deposit);

    setError(null);

    setModal("APPROVE");
  };

  /* ==========================================================
     APPROVE
  ========================================================== */

  const handleApprove = async () => {
    if (!selectedDeposit) {
      return;
    }

    const amount = Number(selectedDeposit.requestedAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("The requested deposit amount is invalid.");

      return;
    }

    const confirmed = window.confirm(
      `Approve deposit of ${formatAmount(
        selectedDeposit.requestedAmount,
      )} for ${getPlayerName(selectedDeposit as DepositRequestView)}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(selectedDeposit.id);

      setError(null);

      /*
       * Current backend endpoint accepts depositId
       * and uses requestedAmount as approved amount.
       *
       * Therefore do not send a different approved
       * amount from the UI.
       */
      await approveAdminDeposit(selectedDeposit.id);

      setModal("NONE");

      setSelectedDeposit(null);

      await loadDeposits(false);
    } catch (err) {
      console.error("Approve deposit error:", err);

      setError(
        err instanceof Error ? err.message : "Failed to approve deposit.",
      );
    } finally {
      setProcessingId(null);
    }
  };

  /* ==========================================================
     OPEN REJECT
  ========================================================== */

  const openReject = (deposit: AdminDepositRequest) => {
    setSelectedDeposit(deposit);

    setRejectReason("");

    setError(null);

    setModal("REJECT");
  };

  /* ==========================================================
     REJECT
  ========================================================== */

  const handleReject = async () => {
    if (!selectedDeposit) {
      return;
    }

    const reason = rejectReason.trim();

    if (!reason) {
      setError("Please enter a rejection reason.");

      return;
    }

    const confirmed = window.confirm(
      `Reject deposit request from ${getPlayerName(
        selectedDeposit as DepositRequestView,
      )}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(selectedDeposit.id);

      setError(null);

      await rejectAdminDeposit(selectedDeposit.id, reason);

      setModal("NONE");

      setSelectedDeposit(null);

      setRejectReason("");

      await loadDeposits(false);
    } catch (err) {
      console.error("Reject deposit error:", err);

      setError(
        err instanceof Error ? err.message : "Failed to reject deposit.",
      );
    } finally {
      setProcessingId(null);
    }
  };

  /* ==========================================================
     VIEW
  ========================================================== */

  const openView = (deposit: AdminDepositRequest) => {
    setSelectedDeposit(deposit);

    setError(null);

    setModal("VIEW");
  };

  /* ==========================================================
     CLOSE MODAL
  ========================================================== */

  const closeModal = () => {
    if (processingId) {
      return;
    }

    setModal("NONE");

    setSelectedDeposit(null);

    setRejectReason("");
  };

  /* ==========================================================
     REQUEST BROWSER NOTIFICATION
  ========================================================== */

  const enableBrowserNotifications = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setError("Browser notifications are not supported.");

      return;
    }

    try {
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        setError("Browser notification permission was not granted.");
      } else {
        setError(null);
      }
    } catch {
      setError("Unable to enable browser notifications.");
    }
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="min-w-0 space-y-6">
      {/* ======================================================
          REALTIME ALERT
      ====================================================== */}

      {alertMessage && (
        <div className="fixed right-4 top-20 z-[100] w-[calc(100%-2rem)] max-w-md">
          <div className="w-full rounded-2xl border border-indigo-200 bg-white p-4 shadow-2xl shadow-indigo-200/40">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => {
                  if (alertDeposit) {
                    openView(alertDeposit);
                  }

                  setAlertMessage(null);
                  setAlertDeposit(null);
                }}
                className="flex min-w-0 flex-1 items-start gap-3 text-left"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  <CreditCard className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900">
                    New Deposit Request
                  </p>

                  <p className="mt-1 text-sm text-slate-600">{alertMessage}</p>

                  {alertDeposit && (
                    <p className="mt-1 text-xs font-semibold text-indigo-600">
                      Amount: {formatAmount(alertDeposit.requestedAmount)}
                    </p>
                  )}

                  <p className="mt-2 text-[11px] font-medium text-slate-400">
                    Click to review request
                  </p>
                </div>
              </button>

              <button
                type="button"
                aria-label="Close notification"
                onClick={() => {
                  setAlertMessage(null);
                  setAlertDeposit(null);
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <CreditCard className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Deposit Requests
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Review and process player deposit requests.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              void enableBrowserNotifications();
            }}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <AlertCircle className="h-4 w-4" />
            Notifications
          </button>

          <button
            type="button"
            onClick={() => {
              void loadDeposits(false);
            }}
            disabled={refreshing}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:from-indigo-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-red-800">{error}</p>
          </div>

          <button
            type="button"
            onClick={() => setError(null)}
            className="rounded-lg p-1 text-red-400 hover:bg-red-100 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ======================================================
          SUMMARY
      ====================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Pending"
          value={pendingCount}
          icon={<Clock3 className="h-5 w-5" />}
          iconClass="bg-amber-100 text-amber-600"
        />

        <SummaryCard
          title="Approved"
          value={approvedCount}
          icon={<CheckCircle2 className="h-5 w-5" />}
          iconClass="bg-emerald-100 text-emerald-600"
        />

        <SummaryCard
          title="Rejected"
          value={rejectedCount}
          icon={<XCircle className="h-5 w-5" />}
          iconClass="bg-red-100 text-red-600"
        />

        <SummaryCard
          title="Cancelled"
          value={cancelledCount}
          icon={<X className="h-5 w-5" />}
          iconClass="bg-slate-100 text-slate-600"
        />
      </div>

      {/* ======================================================
          FILTER / SEARCH
      ====================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <FilterButton
              label="All"
              active={filter === "ALL"}
              count={deposits.length}
              onClick={() => setFilter("ALL")}
            />

            <FilterButton
              label="Pending"
              active={filter === "PENDING"}
              count={pendingCount}
              onClick={() => setFilter("PENDING")}
            />

            <FilterButton
              label="Approved"
              active={filter === "APPROVED"}
              count={approvedCount}
              onClick={() => setFilter("APPROVED")}
            />

            <FilterButton
              label="Rejected"
              active={filter === "REJECTED"}
              count={rejectedCount}
              onClick={() => setFilter("REJECTED")}
            />

            <FilterButton
              label="Cancelled"
              active={filter === "CANCELLED"}
              count={cancelledCount}
              onClick={() => setFilter("CANCELLED")}
            />
          </div>

          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search player, ID, transaction..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>
      </div>

      {/* ======================================================
          TABLE
      ====================================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Deposit Requests
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              {filteredDeposits.length} request
              {filteredDeposits.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="hidden items-center gap-2 text-xs text-slate-400 sm:flex">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Realtime active
          </div>
        </div>

        {loading ? (
          <LoadingState />
        ) : filteredDeposits.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* ==================================================
                DESKTOP TABLE
            ================================================== */}

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Player
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Amount
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Payment
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Transaction
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Date
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Status
                    </th>

                    <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredDeposits.map((deposit) => (
                    <DepositRow
                      key={deposit.id}
                      deposit={deposit}
                      processingId={processingId}
                      onView={openView}
                      onApprove={openApprove}
                      onReject={openReject}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* ==================================================
                MOBILE / TABLET CARDS
            ================================================== */}

            <div className="divide-y divide-slate-100 lg:hidden">
              {filteredDeposits.map((deposit) => (
                <DepositMobileCard
                  key={deposit.id}
                  deposit={deposit}
                  processingId={processingId}
                  onView={openView}
                  onApprove={openApprove}
                  onReject={openReject}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ======================================================
          APPROVE MODAL
      ====================================================== */}

      {modal === "APPROVE" && selectedDeposit && (
        <ApproveModal
          deposit={selectedDeposit}
          processing={processingId === selectedDeposit.id}
          onCancel={closeModal}
          onApprove={() => {
            void handleApprove();
          }}
        />
      )}

      {/* ======================================================
          REJECT MODAL
      ====================================================== */}

      {modal === "REJECT" && selectedDeposit && (
        <RejectModal
          deposit={selectedDeposit}
          reason={rejectReason}
          processing={processingId === selectedDeposit.id}
          onReasonChange={setRejectReason}
          onCancel={closeModal}
          onReject={() => {
            void handleReject();
          }}
        />
      )}

      {/* ======================================================
          VIEW MODAL
      ====================================================== */}

      {modal === "VIEW" && selectedDeposit && (
        <ViewModal deposit={selectedDeposit} onClose={closeModal} />
      )}
    </div>
  );
}

/* ============================================================
   SUMMARY CARD
============================================================ */

function SummaryCard({
  title,
  value,
  icon,
  iconClass,
}: {
  title: string;
  value: number;
  icon: ReactNode;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {title}
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {value.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   FILTER BUTTON
============================================================ */

function FilterButton({
  label,
  active,
  count,
  onClick,
}: {
  label: string;
  active: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-9 items-center gap-2 rounded-xl px-3.5 text-xs font-bold transition ${
        active
          ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {label}

      <span
        className={`rounded-full px-1.5 py-0.5 text-[10px] ${
          active ? "bg-white/20 text-white" : "bg-white text-slate-500"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

/* ============================================================
   DESKTOP ROW
============================================================ */

function DepositRow({
  deposit,
  processingId,
  onView,
  onApprove,
  onReject,
}: {
  deposit: AdminDepositRequest;
  processingId: string | null;
  onView: (deposit: AdminDepositRequest) => void;
  onApprove: (deposit: AdminDepositRequest) => void;
  onReject: (deposit: AdminDepositRequest) => void;
}) {
  const viewDeposit = deposit as DepositRequestView;

  const pending = deposit.status === "PENDING";

  return (
    <tr className="transition hover:bg-slate-50/70">
      <td className="px-5 py-4">
        <div>
          <p className="text-sm font-bold text-slate-900">
            {getPlayerName(viewDeposit)}
          </p>

          <p className="mt-0.5 text-xs text-slate-400">
            {getPlayerPhone(viewDeposit)}
          </p>
        </div>
      </td>

      <td className="px-5 py-4">
        <p className="text-sm font-bold text-slate-900">
          {formatAmount(deposit.requestedAmount)}
        </p>

        {deposit.approvedAmount != null && (
          <p className="mt-0.5 text-[11px] text-emerald-600">
            Approved: {formatAmount(deposit.approvedAmount)}
          </p>
        )}
      </td>

      <td className="px-5 py-4">
        <span className="text-sm font-medium text-slate-700">
          {getPaymentMethodName(viewDeposit)}
        </span>
      </td>

      <td className="px-5 py-4">
        <span className="font-mono text-xs text-slate-600">
          {deposit.transactionNumber ?? "-"}
        </span>
      </td>

      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
        {formatDate(deposit.createdAt)}
      </td>

      <td className="px-5 py-4">
        <StatusBadge status={deposit.status} />
      </td>

      <td className="px-5 py-4">
        <div className="flex justify-end gap-2">
          <ActionButton
            title="View"
            onClick={() => onView(deposit)}
            icon={<Eye className="h-4 w-4" />}
          />

          {pending && (
            <>
              <button
                type="button"
                disabled={processingId === deposit.id}
                onClick={() => onApprove(deposit)}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Approve
              </button>

              <button
                type="button"
                disabled={processingId === deposit.id}
                onClick={() => onReject(deposit)}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-red-50 px-3 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <XCircle className="h-3.5 w-3.5" />
                Reject
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

/* ============================================================
   MOBILE CARD
============================================================ */

function DepositMobileCard({
  deposit,
  processingId,
  onView,
  onApprove,
  onReject,
}: {
  deposit: AdminDepositRequest;
  processingId: string | null;
  onView: (deposit: AdminDepositRequest) => void;
  onApprove: (deposit: AdminDepositRequest) => void;
  onReject: (deposit: AdminDepositRequest) => void;
}) {
  const viewDeposit = deposit as DepositRequestView;

  const pending = deposit.status === "PENDING";

  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">
            {getPlayerName(viewDeposit)}
          </p>

          <p className="mt-0.5 truncate text-xs text-slate-400">
            {getPlayerPhone(viewDeposit)}
          </p>
        </div>

        <StatusBadge status={deposit.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <InfoItem
          label="Requested"
          value={formatAmount(deposit.requestedAmount)}
        />

        <InfoItem label="Payment" value={getPaymentMethodName(viewDeposit)} />

        <InfoItem
          label="Transaction"
          value={deposit.transactionNumber ?? "-"}
        />

        <InfoItem label="Created" value={formatDate(deposit.createdAt)} />
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => onView(deposit)}
          className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <Eye className="h-4 w-4" />
          View
        </button>

        {pending && (
          <>
            <button
              type="button"
              disabled={processingId === deposit.id}
              onClick={() => onApprove(deposit)}
              className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              Approve
            </button>

            <button
              type="button"
              disabled={processingId === deposit.id}
              onClick={() => onReject(deposit)}
              className="inline-flex min-h-10 items-center justify-center rounded-xl bg-red-50 px-3 text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   STATUS
============================================================ */

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${getStatusClass(
        status,
      )}`}
    >
      {getStatusIcon(status)}

      {status}
    </span>
  );
}

/* ============================================================
   ACTION BUTTON
============================================================ */

function ActionButton({
  title,
  icon,
  onClick,
}: {
  title: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
    >
      {icon}
    </button>
  );
}

/* ============================================================
   INFO ITEM
============================================================ */

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1 truncate text-xs font-semibold text-slate-700">
        {value}
      </p>
    </div>
  );
}

/* ============================================================
   APPROVE MODAL
============================================================ */

function ApproveModal({
  deposit,
  processing,
  onCancel,
  onApprove,
}: {
  deposit: AdminDepositRequest;
  processing: boolean;
  onCancel: () => void;
  onApprove: () => void;
}) {
  const viewDeposit = deposit as DepositRequestView;

  return (
    <ModalOverlay>
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Approve Deposit
              </h2>

              <p className="text-xs text-slate-500">
                {getPlayerName(viewDeposit)}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-6">
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-semibold text-slate-500">
                Requested Amount
              </span>

              <span className="text-lg font-bold text-slate-900">
                {formatAmount(deposit.requestedAmount)}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between gap-4">
              <span className="text-xs font-semibold text-slate-500">
                Payment Method
              </span>

              <span className="text-xs font-semibold text-slate-700">
                {getPaymentMethodName(viewDeposit)}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between gap-4">
              <span className="text-xs font-semibold text-slate-500">
                Transaction Number
              </span>

              <span className="break-all text-right font-mono text-xs text-slate-700">
                {deposit.transactionNumber ?? "-"}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-semibold leading-5 text-emerald-800">
              Approving this request will credit{" "}
              <span className="font-bold">
                {formatAmount(deposit.requestedAmount)}
              </span>{" "}
              to the player's wallet.
            </p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-semibold leading-5 text-amber-800">
              The current backend approval endpoint uses the original requested
              amount. The wallet balance and completed deposit transaction will
              be updated automatically.
            </p>
          </div>
        </div>

        <div className="flex gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button
            type="button"
            disabled={processing}
            onClick={onCancel}
            className="min-h-11 flex-1 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={processing}
            onClick={onApprove}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {processing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}

            {processing ? "Processing..." : "Approve Deposit"}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

/* ============================================================
   REJECT MODAL
============================================================ */

function RejectModal({
  deposit,
  reason,
  processing,
  onReasonChange,
  onCancel,
  onReject,
}: {
  deposit: AdminDepositRequest;
  reason: string;
  processing: boolean;
  onReasonChange: (value: string) => void;
  onCancel: () => void;
  onReject: () => void;
}) {
  const viewDeposit = deposit as DepositRequestView;

  return (
    <ModalOverlay>
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="border-b border-slate-100 bg-gradient-to-r from-red-50 to-white px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <XCircle className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Reject Deposit
              </h2>

              <p className="text-xs text-slate-500">
                {getPlayerName(viewDeposit)}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-6">
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-semibold text-slate-500">
                Requested Amount
              </span>

              <span className="text-base font-bold text-slate-900">
                {formatAmount(deposit.requestedAmount)}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between gap-4">
              <span className="text-xs font-semibold text-slate-500">
                Transaction
              </span>

              <span className="break-all text-right font-mono text-xs text-slate-700">
                {deposit.transactionNumber ?? "-"}
              </span>
            </div>
          </div>

          <div>
            <label
              htmlFor="rejectReason"
              className="mb-2 block text-xs font-bold text-slate-700"
            >
              Rejection Reason
            </label>

            <textarea
              id="rejectReason"
              rows={4}
              value={reason}
              onChange={(event) => onReasonChange(event.target.value)}
              placeholder="Enter reason for rejecting this deposit..."
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
          </div>
        </div>

        <div className="flex gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button
            type="button"
            disabled={processing}
            onClick={onCancel}
            className="min-h-11 flex-1 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={processing}
            onClick={onReject}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {processing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}

            {processing ? "Processing..." : "Reject Deposit"}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

/* ============================================================
   VIEW MODAL
============================================================ */

function ViewModal({
  deposit,
  onClose,
}: {
  deposit: AdminDepositRequest;
  onClose: () => void;
}) {
  const viewDeposit = deposit as DepositRequestView;

  return (
    <ModalOverlay>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900">
              Deposit Details
            </h2>

            <p className="mt-0.5 break-all font-mono text-[10px] text-slate-400">
              {deposit.id}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <DetailRow
            label="Status"
            value={<StatusBadge status={deposit.status} />}
          />

          <DetailRow label="Player" value={getPlayerName(viewDeposit)} />

          <DetailRow label="Phone" value={getPlayerPhone(viewDeposit)} />

          <DetailRow label="Username" value={getPlayerUsername(viewDeposit)} />

          <DetailRow label="User ID" value={deposit.userId} />

          <DetailRow
            label="Requested Amount"
            value={formatAmount(deposit.requestedAmount)}
          />

          <DetailRow
            label="Approved Amount"
            value={
              deposit.approvedAmount != null
                ? formatAmount(deposit.approvedAmount)
                : "-"
            }
          />

          <DetailRow
            label="Payment Method"
            value={getPaymentMethodName(viewDeposit)}
          />

          <DetailRow
            label="Payment Method ID"
            value={deposit.paymentMethodId}
          />

          <DetailRow
            label="Transaction Number"
            value={deposit.transactionNumber ?? "-"}
          />

          <DetailRow label="Created At" value={formatDate(deposit.createdAt)} />

          <DetailRow label="Updated At" value={formatDate(deposit.updatedAt)} />

          <DetailRow
            label="Approved At"
            value={deposit.approvedAt ? formatDate(deposit.approvedAt) : "-"}
          />

          <DetailRow label="Approved By" value={deposit.approvedBy ?? "-"} />

          <DetailRow label="Note" value={deposit.note?.trim() || "-"} />

          {deposit.rejectionReason && (
            <DetailRow
              label="Rejection Reason"
              value={deposit.rejectionReason}
            />
          )}
        </div>

        {deposit.status === "PENDING" && (
          <div className="border-t border-slate-100 bg-slate-50 px-6 py-4">
            <p className="text-xs text-slate-500">
              This request is waiting for admin review.
            </p>
          </div>
        )}
      </div>
    </ModalOverlay>
  );
}

/* ============================================================
   DETAIL ROW
============================================================ */

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-slate-50 p-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </span>

      <span className="break-words text-right text-sm font-semibold text-slate-700">
        {value}
      </span>
    </div>
  );
}

/* ============================================================
   MODAL OVERLAY
============================================================ */

function ModalOverlay({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm">
      {children}
    </div>
  );
}

/* ============================================================
   LOADING
============================================================ */

function LoadingState() {
  return (
    <div className="flex min-h-[300px] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <RefreshCw className="h-7 w-7 animate-spin text-indigo-600" />

        <p className="text-sm font-medium text-slate-500">
          Loading deposit requests...
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   EMPTY
============================================================ */

function EmptyState() {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <CreditCard className="h-6 w-6" />
      </div>

      <h3 className="mt-4 text-sm font-bold text-slate-800">
        No deposit requests found
      </h3>

      <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
        There are no deposit requests matching your current filter or search.
      </p>
    </div>
  );
}
