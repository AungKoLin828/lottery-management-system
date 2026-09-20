// src/pages/admin/TransactionManagement.tsx

import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  Clock3,
  CreditCard,
  Eye,
  RefreshCw,
  Search,
  X,
  XCircle,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/* ============================================================
   SERVICES
============================================================ */

import {
  approveAdminDeposit,
  getAdminDepositRequests,
  rejectAdminDeposit,
  type AdminDepositRequest,
} from "@/services/adminDepositService";

import {
  approveAdminWithdraw,
  getAdminWithdrawRequests,
  rejectAdminWithdraw,
  type AdminWithdrawRequest,
} from "@/services/adminWithdrawService";

import { useAdminDepositRealtime } from "@/hooks/realtime/useAdminDepositRealtime";

/* ============================================================
   TYPES
============================================================ */

type TransactionType = "DEPOSIT" | "WITHDRAW";

type AdminTransaction = {
  id: string;
  userId: string;
  playerName: string;
  phone: string;
  type: TransactionType;
  amount: number;
  paymentMethod: string;
  transactionNumber: string;
  status: string;
  createdAt: string;
  note: string;
};

type RequestTab = "DEPOSITS" | "WITHDRAWALS" | "TRANSACTIONS";

type DepositFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

type WithdrawFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

/* ============================================================
   GENERIC HELPERS
============================================================ */

function toNumber(
  value: string | number | null | undefined,
  fallback = 0,
): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
}

function toNullableNumber(
  value: string | number | null | undefined,
): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function toStringValue(
  value: string | number | null | undefined,
  fallback = "",
): string {
  if (value === null || value === undefined) {
    return fallback;
  }

  return String(value);
}

function formatAmount(value: string | number | null | undefined): string {
  const amount = toNumber(value);

  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(value: string | Date | null | undefined): string {
  if (!value) {
    return "-";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Yangon",
  })
    .format(date)
    .replace(",", " ·");
}

/* ============================================================
   DEPOSIT HELPERS
============================================================ */

function getDepositPlayerName(item: AdminDepositRequest): string {
  if (item.user?.fullName?.trim()) {
    return item.user.fullName;
  }

  if (item.user?.username?.trim()) {
    return item.user.username;
  }

  return item.userId;
}

function getDepositPhone(item: AdminDepositRequest): string {
  return item.user?.phone ?? "-";
}

function getDepositPaymentMethod(item: AdminDepositRequest): string {
  if (item.paymentMethod?.name) {
    return item.paymentMethod.name;
  }

  return item.paymentMethodId || "-";
}

/* ============================================================
   WITHDRAW HELPERS
============================================================ */

function getWithdrawPlayerName(item: AdminWithdrawRequest): string {
  if (item.user?.fullName?.trim()) {
    return item.user.fullName;
  }

  if (item.user?.username?.trim()) {
    return item.user.username;
  }

  return item.userId;
}

function getWithdrawPhone(item: AdminWithdrawRequest): string {
  return item.user?.phone ?? "-";
}

function getWithdrawPaymentMethod(item: AdminWithdrawRequest): string {
  if (item.paymentMethod?.name) {
    return item.paymentMethod.name;
  }

  return item.paymentMethodId || "-";
}

function getWithdrawAccountNumber(item: AdminWithdrawRequest): string {
  return item.accountNumber ?? "-";
}

/* ============================================================
   STATUS
============================================================ */

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

function getStatusIcon(status: string) {
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
   NORMALIZE DEPOSIT
============================================================ */

function normalizeDeposit(item: AdminDepositRequest): AdminDepositRequest {
  return {
    ...item,

    id: toStringValue(item.id),

    userId: toStringValue(item.userId),

    requestedAmount: toNumber(item.requestedAmount),

    approvedAmount: toNullableNumber(item.approvedAmount),

    paymentMethodId:
      item.paymentMethodId === null || item.paymentMethodId === undefined
        ? ""
        : String(item.paymentMethodId),

    transactionNumber: item.transactionNumber ?? null,

    status: item.status,

    createdAt: item.createdAt,

    approvedAt: item.approvedAt ?? null,

    note: item.note ?? null,

    rejectionReason: item.rejectionReason ?? null,
  };
}

/* ============================================================
   NORMALIZE WITHDRAW
============================================================ */

function normalizeWithdraw(item: AdminWithdrawRequest): AdminWithdrawRequest {
  return {
    ...item,

    id: toStringValue(item.id),

    userId: toStringValue(item.userId),

    requestedAmount: toNumber(item.requestedAmount),

    approvedAmount: toNullableNumber(item.approvedAmount),

    paymentMethodId:
      item.paymentMethodId === null || item.paymentMethodId === undefined
        ? ""
        : String(item.paymentMethodId),

    transactionNumber: item.transactionNumber ?? null,

    status: item.status,

    createdAt: item.createdAt,

    updatedAt: item.updatedAt ?? null,

    processedAt: item.processedAt ?? null,

    approvedAt: item.approvedAt ?? null,

    approvedBy: item.approvedBy ?? null,

    note: item.note ?? null,

    rejectionReason: item.rejectionReason ?? null,

    accountNumber: item.accountNumber ?? null,

    accountName: item.accountName ?? null,
  };
}

/* ============================================================
   COMPONENT
============================================================ */

export default function TransactionManagement() {
  /* ==========================================================
     MAIN TAB
  ========================================================== */

  const [activeTab, setActiveTab] = useState<RequestTab>("DEPOSITS");

  /* ==========================================================
     DEPOSITS
  ========================================================== */

  const [deposits, setDeposits] = useState<AdminDepositRequest[]>([]);

  const [depositLoading, setDepositLoading] = useState(true);

  const [depositRefreshing, setDepositRefreshing] = useState(false);

  const [depositFilter, setDepositFilter] = useState<DepositFilter>("PENDING");

  const [depositSearch, setDepositSearch] = useState("");

  /* ==========================================================
     WITHDRAWALS
  ========================================================== */

  const [withdraws, setWithdraws] = useState<AdminWithdrawRequest[]>([]);

  const [withdrawLoading, setWithdrawLoading] = useState(true);

  const [withdrawRefreshing, setWithdrawRefreshing] = useState(false);

  const [withdrawFilter, setWithdrawFilter] =
    useState<WithdrawFilter>("PENDING");

  const [withdrawSearch, setWithdrawSearch] = useState("");

  /* ==========================================================
     TRANSACTIONS
  ========================================================== */

  const [transactions] = useState<AdminTransaction[]>([]);

  /* ==========================================================
     COMMON
  ========================================================== */

  const [error, setError] = useState<string | null>(null);

  const [processingId, setProcessingId] = useState<string | null>(null);

  /* ==========================================================
     DEPOSIT MODAL
  ========================================================== */

  const [selectedDeposit, setSelectedDeposit] =
    useState<AdminDepositRequest | null>(null);

  const [approveAmount, setApproveAmount] = useState("");

  const [approveNote, setApproveNote] = useState("");

  const [rejectReason, setRejectReason] = useState("");

  const [depositModal, setDepositModal] = useState<
    "NONE" | "APPROVE" | "REJECT" | "VIEW"
  >("NONE");

  /* ==========================================================
     WITHDRAW VIEW MODAL
  ========================================================== */

  const [selectedWithdraw, setSelectedWithdraw] =
    useState<AdminWithdrawRequest | null>(null);

  const [withdrawModal, setWithdrawModal] = useState<"NONE" | "VIEW">("NONE");

  /* ==========================================================
     LOAD DEPOSITS
  ========================================================== */

  const loadDeposits = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setDepositLoading(true);
      } else {
        setDepositRefreshing(true);
      }

      setError(null);

      const response = await getAdminDepositRequests();

      const normalized = response.map(normalizeDeposit);

      setDeposits(normalized);
    } catch (err) {
      console.error("Load admin deposits error:", err);

      setError(
        err instanceof Error ? err.message : "Failed to load deposit requests.",
      );
    } finally {
      setDepositLoading(false);
      setDepositRefreshing(false);
    }
  }, []);

  /* ==========================================================
     LOAD WITHDRAWS
  ========================================================== */

  const loadWithdraws = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setWithdrawLoading(true);
      } else {
        setWithdrawRefreshing(true);
      }

      setError(null);

      const response = await getAdminWithdrawRequests();

      const normalized = response.map(normalizeWithdraw);

      setWithdraws(normalized);
    } catch (err) {
      console.error("Load admin withdrawals error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load withdrawal requests.",
      );
    } finally {
      setWithdrawLoading(false);
      setWithdrawRefreshing(false);
    }
  }, []);

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    void loadDeposits();
    void loadWithdraws();
  }, [loadDeposits, loadWithdraws]);

  /* ==========================================================
     REALTIME DEPOSIT
  ========================================================== */

  const handleNewDeposit = useCallback((deposit: AdminDepositRequest) => {
    const normalized = normalizeDeposit(deposit);

    setDeposits((current) => {
      const exists = current.some((item) => item.id === normalized.id);

      if (exists) {
        return current.map((item) =>
          item.id === normalized.id ? normalized : item,
        );
      }

      return [normalized, ...current];
    });
  }, []);

  useAdminDepositRealtime({
    enabled: true,
    onNewDeposit: handleNewDeposit,
  });

  /* ==========================================================
     DEPOSIT COUNTS
  ========================================================== */

  const depositPendingCount = deposits.filter(
    (item) => item.status === "PENDING",
  ).length;

  const depositApprovedCount = deposits.filter(
    (item) => item.status === "APPROVED",
  ).length;

  const depositRejectedCount = deposits.filter(
    (item) => item.status === "REJECTED",
  ).length;

  /* ==========================================================
     WITHDRAW COUNTS
  ========================================================== */

  const withdrawPendingCount = withdraws.filter(
    (item) => item.status === "PENDING",
  ).length;

  const withdrawApprovedCount = withdraws.filter(
    (item) => item.status === "APPROVED",
  ).length;

  const withdrawRejectedCount = withdraws.filter(
    (item) => item.status === "REJECTED",
  ).length;

  /* ==========================================================
     FILTER DEPOSITS
  ========================================================== */

  const filteredDeposits = useMemo(() => {
    const query = depositSearch.trim().toLowerCase();

    return deposits.filter((item) => {
      const matchesFilter =
        depositFilter === "ALL" || item.status === depositFilter;

      if (!matchesFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchable = [
        item.id,
        item.userId,
        item.user?.username,
        item.user?.fullName,
        item.user?.phone,
        item.transactionNumber,
        item.paymentMethodId,
        item.paymentMethod?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [deposits, depositFilter, depositSearch]);

  /* ==========================================================
     FILTER WITHDRAWS
  ========================================================== */

  const filteredWithdraws = useMemo(() => {
    const query = withdrawSearch.trim().toLowerCase();

    return withdraws.filter((item) => {
      const matchesFilter =
        withdrawFilter === "ALL" || item.status === withdrawFilter;

      if (!matchesFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchable = [
        item.id,
        item.userId,
        item.user?.username,
        item.user?.fullName,
        item.user?.phone,
        item.transactionNumber,
        item.paymentMethodId,
        item.paymentMethod?.name,
        item.accountNumber,
        item.accountName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [withdraws, withdrawFilter, withdrawSearch]);

  /* ==========================================================
     OPEN DEPOSIT APPROVE
  ========================================================== */

  const openDepositApprove = (deposit: AdminDepositRequest) => {
    setSelectedDeposit(deposit);

    setApproveAmount(String(deposit.requestedAmount));

    setApproveNote("");

    setDepositModal("APPROVE");
  };

  /* ==========================================================
     APPROVE DEPOSIT
  ========================================================== */

  const handleApproveDeposit = async () => {
    if (!selectedDeposit) {
      return;
    }

    const amount = Number(approveAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Approved deposit amount must be greater than 0.");

      return;
    }

    const requestedAmount = Number(selectedDeposit.requestedAmount);

    if (Number.isFinite(requestedAmount) && amount > requestedAmount) {
      setError("Approved amount cannot be greater than requested amount.");

      return;
    }

    const confirmed = window.confirm(
      `Approve deposit of ${formatAmount(
        amount,
      )} MMK for ${getDepositPlayerName(selectedDeposit)}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(selectedDeposit.id);

      setError(null);

      await approveAdminDeposit(selectedDeposit.id, {
        approvedAmount: amount,
        note: approveNote.trim() || undefined,
      });

      setDepositModal("NONE");

      setSelectedDeposit(null);

      setApproveAmount("");

      setApproveNote("");

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
     OPEN DEPOSIT REJECT
  ========================================================== */

  const openDepositReject = (deposit: AdminDepositRequest) => {
    setSelectedDeposit(deposit);

    setRejectReason("");

    setDepositModal("REJECT");
  };

  /* ==========================================================
     REJECT DEPOSIT
  ========================================================== */

  const handleRejectDeposit = async () => {
    if (!selectedDeposit) {
      return;
    }

    const reason = rejectReason.trim();

    if (!reason) {
      setError("Please enter a rejection reason.");

      return;
    }

    const confirmed = window.confirm(
      `Reject deposit request from ${getDepositPlayerName(selectedDeposit)}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(selectedDeposit.id);

      setError(null);

      await rejectAdminDeposit(selectedDeposit.id, reason);

      setDepositModal("NONE");

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
     OPEN DEPOSIT VIEW
  ========================================================== */

  const openDepositView = (deposit: AdminDepositRequest) => {
    setSelectedDeposit(deposit);

    setDepositModal("VIEW");
  };

  /* ==========================================================
     APPROVE WITHDRAW
  ========================================================== */

  const handleApproveWithdraw = async (withdraw: AdminWithdrawRequest) => {
    const amount = toNumber(withdraw.requestedAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Invalid withdrawal amount.");

      return;
    }

    const confirmed = window.confirm(
      `Approve withdrawal of ${formatAmount(
        amount,
      )} MMK for ${getWithdrawPlayerName(withdraw)}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(withdraw.id);

      setError(null);

      /*
       * IMPORTANT:
       *
       * The backend performs:
       * - request validation
       * - wallet balance validation
       * - wallet deduction
       * - withdrawal status update
       * - transaction creation
       *
       * The frontend does not modify the wallet.
       */
      await approveAdminWithdraw(withdraw.id, {
        approvedAmount: amount,
      });

      await loadWithdraws(false);
    } catch (err) {
      console.error("Approve withdrawal error:", err);

      setError(
        err instanceof Error ? err.message : "Failed to approve withdrawal.",
      );
    } finally {
      setProcessingId(null);
    }
  };

  /* ==========================================================
     REJECT WITHDRAW
  ========================================================== */

  const handleRejectWithdraw = async (withdraw: AdminWithdrawRequest) => {
    const reason = window.prompt("Enter withdrawal rejection reason:");

    if (reason === null) {
      return;
    }

    if (!reason.trim()) {
      setError("Withdrawal rejection reason is required.");

      return;
    }

    const confirmed = window.confirm(
      `Reject withdrawal request from ${getWithdrawPlayerName(withdraw)}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(withdraw.id);

      setError(null);

      await rejectAdminWithdraw(withdraw.id, reason.trim());

      await loadWithdraws(false);
    } catch (err) {
      console.error("Reject withdrawal error:", err);

      setError(
        err instanceof Error ? err.message : "Failed to reject withdrawal.",
      );
    } finally {
      setProcessingId(null);
    }
  };

  /* ==========================================================
     OPEN WITHDRAW VIEW
  ========================================================== */

  const openWithdrawView = (withdraw: AdminWithdrawRequest) => {
    setSelectedWithdraw(withdraw);

    setWithdrawModal("VIEW");
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="min-w-0 space-y-6">
      {/* HEADER */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <CreditCard className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Transaction Management
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage real player deposits, withdrawals and transactions.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={depositRefreshing || withdrawRefreshing}
          onClick={() => {
            void loadDeposits(false);
            void loadWithdraws(false);
          }}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:from-indigo-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              depositRefreshing || withdrawRefreshing ? "animate-spin" : ""
            }`}
          />
          Refresh
        </button>
      </div>

      {/* ERROR */}

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

      {/* SUMMARY */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Pending Deposits"
          value={depositPendingCount}
          icon={<ArrowDownToLine className="h-5 w-5" />}
          iconClass="bg-amber-100 text-amber-600"
        />

        <SummaryCard
          title="Approved Deposits"
          value={depositApprovedCount}
          icon={<CheckCircle2 className="h-5 w-5" />}
          iconClass="bg-emerald-100 text-emerald-600"
        />

        <SummaryCard
          title="Pending Withdrawals"
          value={withdrawPendingCount}
          icon={<ArrowUpFromLine className="h-5 w-5" />}
          iconClass="bg-blue-100 text-blue-600"
        />

        <SummaryCard
          title="Approved Withdrawals"
          value={withdrawApprovedCount}
          icon={<CheckCircle2 className="h-5 w-5" />}
          iconClass="bg-violet-100 text-violet-600"
        />
      </div>

      {/* MAIN TABS */}

      <div className="flex overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
        <TabButton
          active={activeTab === "DEPOSITS"}
          icon={<ArrowDownToLine className="h-4 w-4" />}
          label="Deposit Requests"
          count={depositPendingCount}
          onClick={() => setActiveTab("DEPOSITS")}
        />

        <TabButton
          active={activeTab === "WITHDRAWALS"}
          icon={<ArrowUpFromLine className="h-4 w-4" />}
          label="Withdraw Requests"
          count={withdrawPendingCount}
          onClick={() => setActiveTab("WITHDRAWALS")}
        />

        <TabButton
          active={activeTab === "TRANSACTIONS"}
          icon={<CreditCard className="h-4 w-4" />}
          label="Transactions"
          count={transactions.length}
          onClick={() => setActiveTab("TRANSACTIONS")}
        />
      </div>

      {/* DEPOSITS */}

      {activeTab === "DEPOSITS" && (
        <DepositSection
          deposits={filteredDeposits}
          totalCount={deposits.length}
          loading={depositLoading}
          filter={depositFilter}
          search={depositSearch}
          pendingCount={depositPendingCount}
          approvedCount={depositApprovedCount}
          rejectedCount={depositRejectedCount}
          processingId={processingId}
          onFilterChange={setDepositFilter}
          onSearchChange={setDepositSearch}
          onView={openDepositView}
          onApprove={openDepositApprove}
          onReject={openDepositReject}
        />
      )}

      {/* WITHDRAWALS */}

      {activeTab === "WITHDRAWALS" && (
        <WithdrawSection
          withdraws={filteredWithdraws}
          totalCount={withdraws.length}
          loading={withdrawLoading}
          filter={withdrawFilter}
          search={withdrawSearch}
          pendingCount={withdrawPendingCount}
          approvedCount={withdrawApprovedCount}
          rejectedCount={withdrawRejectedCount}
          processingId={processingId}
          onFilterChange={setWithdrawFilter}
          onSearchChange={setWithdrawSearch}
          onView={openWithdrawView}
          onApprove={handleApproveWithdraw}
          onReject={handleRejectWithdraw}
        />
      )}

      {/* TRANSACTIONS */}

      {activeTab === "TRANSACTIONS" && (
        <TransactionSection transactions={transactions} />
      )}

      {/* DEPOSIT MODALS */}

      {depositModal === "APPROVE" && selectedDeposit && (
        <ApproveDepositModal
          deposit={selectedDeposit}
          amount={approveAmount}
          note={approveNote}
          processing={processingId === selectedDeposit.id}
          onAmountChange={setApproveAmount}
          onNoteChange={setApproveNote}
          onCancel={() => {
            if (!processingId) {
              setDepositModal("NONE");

              setSelectedDeposit(null);
            }
          }}
          onApprove={() => {
            void handleApproveDeposit();
          }}
        />
      )}

      {depositModal === "REJECT" && selectedDeposit && (
        <RejectDepositModal
          deposit={selectedDeposit}
          reason={rejectReason}
          processing={processingId === selectedDeposit.id}
          onReasonChange={setRejectReason}
          onCancel={() => {
            if (!processingId) {
              setDepositModal("NONE");

              setSelectedDeposit(null);
            }
          }}
          onReject={() => {
            void handleRejectDeposit();
          }}
        />
      )}

      {depositModal === "VIEW" && selectedDeposit && (
        <DepositViewModal
          deposit={selectedDeposit}
          onClose={() => {
            setDepositModal("NONE");
            setSelectedDeposit(null);
          }}
        />
      )}

      {/* WITHDRAW VIEW */}

      {withdrawModal === "VIEW" && selectedWithdraw && (
        <WithdrawViewModal
          withdraw={selectedWithdraw}
          onClose={() => {
            setWithdrawModal("NONE");
            setSelectedWithdraw(null);
          }}
        />
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
   TAB BUTTON
============================================================ */

function TabButton({
  active,
  icon,
  label,
  count,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-w-max flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${
        active
          ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      {icon}

      {label}

      {count > 0 && (
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] ${
            active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
          }`}
        >
          {count}
        </span>
      )}
    </button>
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
   DEPOSIT SECTION
============================================================ */

function DepositSection({
  deposits,
  totalCount,
  loading,
  filter,
  search,
  pendingCount,
  approvedCount,
  rejectedCount,
  processingId,
  onFilterChange,
  onSearchChange,
  onView,
  onApprove,
  onReject,
}: {
  deposits: AdminDepositRequest[];
  totalCount: number;
  loading: boolean;
  filter: DepositFilter;
  search: string;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  processingId: string | null;
  onFilterChange: (value: DepositFilter) => void;
  onSearchChange: (value: string) => void;
  onView: (deposit: AdminDepositRequest) => void;
  onApprove: (deposit: AdminDepositRequest) => void;
  onReject: (deposit: AdminDepositRequest) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <FilterButton
              label="All"
              active={filter === "ALL"}
              count={totalCount}
              onClick={() => onFilterChange("ALL")}
            />

            <FilterButton
              label="Pending"
              active={filter === "PENDING"}
              count={pendingCount}
              onClick={() => onFilterChange("PENDING")}
            />

            <FilterButton
              label="Approved"
              active={filter === "APPROVED"}
              count={approvedCount}
              onClick={() => onFilterChange("APPROVED")}
            />

            <FilterButton
              label="Rejected"
              active={filter === "REJECTED"}
              count={rejectedCount}
              onClick={() => onFilterChange("REJECTED")}
            />
          </div>

          <SearchBox
            value={search}
            onChange={onSearchChange}
            placeholder="Search deposit..."
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-bold text-slate-900">
            Deposit Requests
          </h2>

          <p className="mt-0.5 text-xs text-slate-500">
            {deposits.length} request
            {deposits.length === 1 ? "" : "s"}
          </p>
        </div>

        {loading ? (
          <LoadingState label="Loading deposit requests..." />
        ) : deposits.length === 0 ? (
          <EmptyState
            icon={<ArrowDownToLine className="h-6 w-6" />}
            title="No deposit requests found"
            description="No deposit requests match the current filter or search."
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1050px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    <TableHeader>Player</TableHeader>

                    <TableHeader>Amount</TableHeader>

                    <TableHeader>Payment</TableHeader>

                    <TableHeader>Transaction</TableHeader>

                    <TableHeader>Date</TableHeader>

                    <TableHeader>Status</TableHeader>

                    <TableHeader align="right">Action</TableHeader>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {deposits.map((deposit) => (
                    <DepositRow
                      key={deposit.id}
                      deposit={deposit}
                      processingId={processingId}
                      onView={onView}
                      onApprove={onApprove}
                      onReject={onReject}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 lg:hidden">
              {deposits.map((deposit) => (
                <DepositMobileCard
                  key={deposit.id}
                  deposit={deposit}
                  processingId={processingId}
                  onView={onView}
                  onApprove={onApprove}
                  onReject={onReject}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   WITHDRAW SECTION
============================================================ */

function WithdrawSection({
  withdraws,
  totalCount,
  loading,
  filter,
  search,
  pendingCount,
  approvedCount,
  rejectedCount,
  processingId,
  onFilterChange,
  onSearchChange,
  onView,
  onApprove,
  onReject,
}: {
  withdraws: AdminWithdrawRequest[];
  totalCount: number;
  loading: boolean;
  filter: WithdrawFilter;
  search: string;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  processingId: string | null;
  onFilterChange: (value: WithdrawFilter) => void;
  onSearchChange: (value: string) => void;
  onView: (withdraw: AdminWithdrawRequest) => void;
  onApprove: (withdraw: AdminWithdrawRequest) => void;
  onReject: (withdraw: AdminWithdrawRequest) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <FilterButton
              label="All"
              active={filter === "ALL"}
              count={totalCount}
              onClick={() => onFilterChange("ALL")}
            />

            <FilterButton
              label="Pending"
              active={filter === "PENDING"}
              count={pendingCount}
              onClick={() => onFilterChange("PENDING")}
            />

            <FilterButton
              label="Approved"
              active={filter === "APPROVED"}
              count={approvedCount}
              onClick={() => onFilterChange("APPROVED")}
            />

            <FilterButton
              label="Rejected"
              active={filter === "REJECTED"}
              count={rejectedCount}
              onClick={() => onFilterChange("REJECTED")}
            />
          </div>

          <SearchBox
            value={search}
            onChange={onSearchChange}
            placeholder="Search withdrawal..."
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-bold text-slate-900">
            Withdraw Requests
          </h2>

          <p className="mt-0.5 text-xs text-slate-500">
            {withdraws.length} request
            {withdraws.length === 1 ? "" : "s"}
          </p>
        </div>

        {loading ? (
          <LoadingState label="Loading withdrawal requests..." />
        ) : withdraws.length === 0 ? (
          <EmptyState
            icon={<ArrowUpFromLine className="h-6 w-6" />}
            title="No withdrawal requests found"
            description="No withdrawal requests match the current filter or search."
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1100px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    <TableHeader>Player</TableHeader>

                    <TableHeader>Amount</TableHeader>

                    <TableHeader>Payment</TableHeader>

                    <TableHeader>Account</TableHeader>

                    <TableHeader>Date</TableHeader>

                    <TableHeader>Status</TableHeader>

                    <TableHeader align="right">Action</TableHeader>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {withdraws.map((withdraw) => (
                    <WithdrawRow
                      key={withdraw.id}
                      withdraw={withdraw}
                      processingId={processingId}
                      onView={onView}
                      onApprove={onApprove}
                      onReject={onReject}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 lg:hidden">
              {withdraws.map((withdraw) => (
                <WithdrawMobileCard
                  key={withdraw.id}
                  withdraw={withdraw}
                  processingId={processingId}
                  onView={onView}
                  onApprove={onApprove}
                  onReject={onReject}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   DEPOSIT ROW
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
  const pending = deposit.status === "PENDING";

  return (
    <tr className="transition hover:bg-slate-50/70">
      <td className="px-5 py-4">
        <p className="text-sm font-bold text-slate-900">
          {getDepositPlayerName(deposit)}
        </p>

        <p className="mt-0.5 text-xs text-slate-400">
          {getDepositPhone(deposit)}
        </p>
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

      <td className="px-5 py-4 text-sm font-medium text-slate-700">
        {getDepositPaymentMethod(deposit)}
      </td>

      <td className="px-5 py-4 font-mono text-xs text-slate-600">
        {deposit.transactionNumber ?? "-"}
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
   WITHDRAW ROW
============================================================ */

function WithdrawRow({
  withdraw,
  processingId,
  onView,
  onApprove,
  onReject,
}: {
  withdraw: AdminWithdrawRequest;
  processingId: string | null;
  onView: (withdraw: AdminWithdrawRequest) => void;
  onApprove: (withdraw: AdminWithdrawRequest) => void;
  onReject: (withdraw: AdminWithdrawRequest) => void;
}) {
  const pending = withdraw.status === "PENDING";

  return (
    <tr className="transition hover:bg-slate-50/70">
      <td className="px-5 py-4">
        <p className="text-sm font-bold text-slate-900">
          {getWithdrawPlayerName(withdraw)}
        </p>

        <p className="mt-0.5 text-xs text-slate-400">
          {getWithdrawPhone(withdraw)}
        </p>
      </td>

      <td className="px-5 py-4">
        <p className="text-sm font-bold text-slate-900">
          {formatAmount(withdraw.requestedAmount)}
        </p>

        {withdraw.approvedAmount != null && (
          <p className="mt-0.5 text-[11px] text-emerald-600">
            Approved: {formatAmount(withdraw.approvedAmount)}
          </p>
        )}
      </td>

      <td className="px-5 py-4 text-sm font-medium text-slate-700">
        {getWithdrawPaymentMethod(withdraw)}
      </td>

      <td className="px-5 py-4 font-mono text-xs text-slate-600">
        {getWithdrawAccountNumber(withdraw)}
      </td>

      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
        {formatDate(withdraw.createdAt)}
      </td>

      <td className="px-5 py-4">
        <StatusBadge status={withdraw.status} />
      </td>

      <td className="px-5 py-4">
        <div className="flex justify-end gap-2">
          <ActionButton
            title="View"
            onClick={() => onView(withdraw)}
            icon={<Eye className="h-4 w-4" />}
          />

          {pending && (
            <>
              <button
                type="button"
                disabled={processingId === withdraw.id}
                onClick={() => onApprove(withdraw)}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Approve
              </button>

              <button
                type="button"
                disabled={processingId === withdraw.id}
                onClick={() => onReject(withdraw)}
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
   DEPOSIT MOBILE CARD
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
  const pending = deposit.status === "PENDING";

  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">
            {getDepositPlayerName(deposit)}
          </p>

          <p className="mt-0.5 truncate text-xs text-slate-400">
            {getDepositPhone(deposit)}
          </p>
        </div>

        <StatusBadge status={deposit.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <InfoItem
          label="Requested"
          value={formatAmount(deposit.requestedAmount)}
        />

        <InfoItem label="Payment" value={getDepositPaymentMethod(deposit)} />

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
   WITHDRAW MOBILE CARD
============================================================ */

function WithdrawMobileCard({
  withdraw,
  processingId,
  onView,
  onApprove,
  onReject,
}: {
  withdraw: AdminWithdrawRequest;
  processingId: string | null;
  onView: (withdraw: AdminWithdrawRequest) => void;
  onApprove: (withdraw: AdminWithdrawRequest) => void;
  onReject: (withdraw: AdminWithdrawRequest) => void;
}) {
  const pending = withdraw.status === "PENDING";

  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">
            {getWithdrawPlayerName(withdraw)}
          </p>

          <p className="mt-0.5 truncate text-xs text-slate-400">
            {getWithdrawPhone(withdraw)}
          </p>
        </div>

        <StatusBadge status={withdraw.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <InfoItem
          label="Requested"
          value={formatAmount(withdraw.requestedAmount)}
        />

        <InfoItem label="Payment" value={getWithdrawPaymentMethod(withdraw)} />

        <InfoItem label="Account" value={getWithdrawAccountNumber(withdraw)} />

        <InfoItem label="Created" value={formatDate(withdraw.createdAt)} />
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => onView(withdraw)}
          className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <Eye className="h-4 w-4" />
          View
        </button>

        {pending && (
          <>
            <button
              type="button"
              disabled={processingId === withdraw.id}
              onClick={() => onApprove(withdraw)}
              className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              Approve
            </button>

            <button
              type="button"
              disabled={processingId === withdraw.id}
              onClick={() => onReject(withdraw)}
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
   TRANSACTION SECTION
============================================================ */

function TransactionSection({
  transactions,
}: {
  transactions: AdminTransaction[];
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-base font-bold text-slate-900">
          Transaction History
        </h2>

        <p className="mt-0.5 text-xs text-slate-500">
          Completed deposit and withdrawal transactions.
        </p>
      </div>

      {transactions.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="h-6 w-6" />}
          title="No transactions loaded"
          description="Connect the transaction history endpoint to display completed transactions."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                <TableHeader>Player</TableHeader>

                <TableHeader>Type</TableHeader>

                <TableHeader>Amount</TableHeader>

                <TableHeader>Payment</TableHeader>

                <TableHeader>Transaction</TableHeader>

                <TableHeader>Status</TableHeader>

                <TableHeader>Date</TableHeader>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <p className="text-sm font-bold text-slate-900">
                      {transaction.playerName}
                    </p>

                    <p className="text-xs text-slate-400">
                      {transaction.phone}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                        transaction.type === "DEPOSIT"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {transaction.type === "DEPOSIT" ? (
                        <ArrowDownToLine className="h-3 w-3" />
                      ) : (
                        <ArrowUpFromLine className="h-3 w-3" />
                      )}

                      {transaction.type}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-sm font-bold text-slate-900">
                    {formatAmount(transaction.amount)} MMK
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-600">
                    {transaction.paymentMethod}
                  </td>

                  <td className="px-5 py-4 font-mono text-xs text-slate-600">
                    {transaction.transactionNumber}
                  </td>

                  <td className="px-5 py-4">
                    <StatusBadge status={transaction.status} />
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                    {formatDate(transaction.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   APPROVE DEPOSIT MODAL
============================================================ */

function ApproveDepositModal({
  deposit,
  amount,
  note,
  processing,
  onAmountChange,
  onNoteChange,
  onCancel,
  onApprove,
}: {
  deposit: AdminDepositRequest;
  amount: string;
  note: string;
  processing: boolean;
  onAmountChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onCancel: () => void;
  onApprove: () => void;
}) {
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
                {getDepositPlayerName(deposit)}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-6">
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Requested Amount
              </span>

              <span className="text-base font-bold text-slate-900">
                {formatAmount(deposit.requestedAmount)} MMK
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Payment Method
              </span>

              <span className="text-xs font-bold text-slate-700">
                {getDepositPaymentMethod(deposit)}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Transaction Number
              </span>

              <span className="font-mono text-xs text-slate-700">
                {deposit.transactionNumber ?? "-"}
              </span>
            </div>
          </div>

          <div>
            <label
              htmlFor="approvedAmount"
              className="mb-2 block text-xs font-bold text-slate-700"
            >
              Approved Amount
            </label>

            <input
              id="approvedAmount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(event) => onAmountChange(event.target.value)}
              disabled={processing}
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
            />

            <p className="mt-1.5 text-[11px] text-slate-400">
              This amount will be credited to the player's wallet by the
              backend.
            </p>
          </div>

          <div>
            <label
              htmlFor="approveNote"
              className="mb-2 block text-xs font-bold text-slate-700"
            >
              Note
              <span className="ml-1 font-normal text-slate-400">
                (optional)
              </span>
            </label>

            <textarea
              id="approveNote"
              rows={3}
              value={note}
              onChange={(event) => onNoteChange(event.target.value)}
              disabled={processing}
              placeholder="Optional approval note..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
            />
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-semibold leading-5 text-amber-800">
              The backend will update the deposit request, credit the player's
              wallet and create the transaction atomically.
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
   REJECT DEPOSIT MODAL
============================================================ */

function RejectDepositModal({
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
                {getDepositPlayerName(deposit)}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-6">
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Requested Amount
              </span>

              <span className="text-base font-bold text-slate-900">
                {formatAmount(deposit.requestedAmount)} MMK
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
              disabled={processing}
              placeholder="Enter reason for rejecting this deposit..."
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:bg-slate-50"
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
   DEPOSIT VIEW MODAL
============================================================ */

function DepositViewModal({
  deposit,
  onClose,
}: {
  deposit: AdminDepositRequest;
  onClose: () => void;
}) {
  return (
    <ModalOverlay>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Deposit Details
            </h2>

            <p className="mt-0.5 font-mono text-[10px] text-slate-400">
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

          <DetailRow label="Player" value={getDepositPlayerName(deposit)} />

          <DetailRow label="Phone" value={getDepositPhone(deposit)} />

          <DetailRow label="Username" value={deposit.user?.username ?? "-"} />

          <DetailRow
            label="Requested Amount"
            value={`${formatAmount(deposit.requestedAmount)} MMK`}
          />

          <DetailRow
            label="Approved Amount"
            value={
              deposit.approvedAmount != null
                ? `${formatAmount(deposit.approvedAmount)} MMK`
                : "-"
            }
          />

          <DetailRow
            label="Payment Method"
            value={getDepositPaymentMethod(deposit)}
          />

          <DetailRow
            label="Transaction Number"
            value={deposit.transactionNumber ?? "-"}
          />

          <DetailRow label="Created At" value={formatDate(deposit.createdAt)} />

          <DetailRow
            label="Approved At"
            value={deposit.approvedAt ? formatDate(deposit.approvedAt) : "-"}
          />

          <DetailRow label="Note" value={deposit.note?.trim() || "-"} />

          {deposit.rejectionReason && (
            <DetailRow
              label="Rejection Reason"
              value={deposit.rejectionReason}
            />
          )}
        </div>
      </div>
    </ModalOverlay>
  );
}

/* ============================================================
   WITHDRAW VIEW MODAL
============================================================ */

function WithdrawViewModal({
  withdraw,
  onClose,
}: {
  withdraw: AdminWithdrawRequest;
  onClose: () => void;
}) {
  return (
    <ModalOverlay>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Withdrawal Details
            </h2>

            <p className="mt-0.5 font-mono text-[10px] text-slate-400">
              {withdraw.id}
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
            value={<StatusBadge status={withdraw.status} />}
          />

          <DetailRow label="Player" value={getWithdrawPlayerName(withdraw)} />

          <DetailRow label="Phone" value={getWithdrawPhone(withdraw)} />

          <DetailRow label="Username" value={withdraw.user?.username ?? "-"} />

          <DetailRow
            label="Requested Amount"
            value={`${formatAmount(withdraw.requestedAmount)} MMK`}
          />

          <DetailRow
            label="Approved Amount"
            value={
              withdraw.approvedAmount != null
                ? `${formatAmount(withdraw.approvedAmount)} MMK`
                : "-"
            }
          />

          <DetailRow
            label="Payment Method"
            value={getWithdrawPaymentMethod(withdraw)}
          />

          <DetailRow
            label="Account Number"
            value={getWithdrawAccountNumber(withdraw)}
          />

          <DetailRow label="Account Name" value={withdraw.accountName ?? "-"} />

          <DetailRow
            label="Transaction Number"
            value={withdraw.transactionNumber ?? "-"}
          />

          <DetailRow
            label="Created At"
            value={formatDate(withdraw.createdAt)}
          />

          <DetailRow
            label="Approved At"
            value={withdraw.approvedAt ? formatDate(withdraw.approvedAt) : "-"}
          />

          <DetailRow
            label="Processed At"
            value={
              withdraw.processedAt ? formatDate(withdraw.processedAt) : "-"
            }
          />

          <DetailRow label="Approved By" value={withdraw.approvedBy ?? "-"} />

          <DetailRow label="Note" value={withdraw.note?.trim() || "-"} />

          {withdraw.rejectionReason && (
            <DetailRow
              label="Rejection Reason"
              value={withdraw.rejectionReason}
            />
          )}
        </div>
      </div>
    </ModalOverlay>
  );
}

/* ============================================================
   SEARCH BOX
============================================================ */

function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative w-full lg:max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
      />
    </div>
  );
}

/* ============================================================
   TABLE HEADER
============================================================ */

function TableHeader({
  children,
  align = "left",
}: {
  children: ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-5 py-3 ${
        align === "right" ? "text-right" : "text-left"
      } text-[11px] font-bold uppercase tracking-wider text-slate-500`}
    >
      {children}
    </th>
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

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex min-h-[280px] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <RefreshCw className="h-7 w-7 animate-spin text-indigo-600" />

        <p className="text-sm font-medium text-slate-500">{label}</p>
      </div>
    </div>
  );
}

/* ============================================================
   EMPTY
============================================================ */

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        {icon}
      </div>

      <h3 className="mt-4 text-sm font-bold text-slate-800">{title}</h3>

      <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}
