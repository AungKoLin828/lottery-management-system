import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AlertCircle,
  Bot,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  Loader2,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  User,
  UserRound,
  X,
  Zap,
} from "lucide-react";

import {
  getAdminSupportTicket,
  getAdminSupportTickets,
  replyToSupportTicket,
  updateSupportTicketPriority,
  updateSupportTicketStatus,
  type AdminSupportMessage,
  type AdminSupportTicket,
  type SupportTicketPriority,
  type SupportTicketStatus,
} from "../../services/adminSupportService";

import {
  getAdminAISettings,
  updateAdminAISettings,
} from "../../services/adminAISettingsService";

/* ============================================================
   CONSTANTS
============================================================ */

const STATUS_FILTERS: Array<
  SupportTicketStatus | "ALL"
> = [
  "ALL",
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
];

const PRIORITY_FILTERS: Array<
  SupportTicketPriority | "ALL"
> = [
  "ALL",
  "URGENT",
  "HIGH",
  "NORMAL",
  "LOW",
];

/* ============================================================
   HELPERS
============================================================ */

function formatDateTime(
  value?: string | null,
): string {
  if (!value) {
    return "-";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return date.toLocaleString(
    undefined,
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

function getStatusLabel(
  status: SupportTicketStatus,
): string {
  switch (status) {
    case "OPEN":
      return "Open";

    case "IN_PROGRESS":
      return "In Progress";

    case "RESOLVED":
      return "Resolved";

    case "CLOSED":
      return "Closed";

    default:
      return status;
  }
}

function getPriorityLabel(
  priority?: SupportTicketPriority | null,
): string {
  switch (priority) {
    case "URGENT":
      return "Urgent";

    case "HIGH":
      return "High";

    case "NORMAL":
      return "Normal";

    case "LOW":
      return "Low";

    default:
      return "Normal";
  }
}

function getStatusClassName(
  status: SupportTicketStatus,
): string {
  switch (status) {
    case "OPEN":
      return "bg-blue-50 text-blue-700 ring-blue-600/20";

    case "IN_PROGRESS":
      return "bg-amber-50 text-amber-700 ring-amber-600/20";

    case "RESOLVED":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";

    case "CLOSED":
      return "bg-slate-100 text-slate-600 ring-slate-500/20";

    default:
      return "bg-slate-100 text-slate-600 ring-slate-500/20";
  }
}

function getPriorityClassName(
  priority?: SupportTicketPriority | null,
): string {
  switch (priority) {
    case "URGENT":
      return "bg-red-50 text-red-700 ring-red-600/20";

    case "HIGH":
      return "bg-orange-50 text-orange-700 ring-orange-600/20";

    case "NORMAL":
      return "bg-blue-50 text-blue-700 ring-blue-600/20";

    case "LOW":
      return "bg-slate-100 text-slate-600 ring-slate-500/20";

    default:
      return "bg-slate-100 text-slate-600 ring-slate-500/20";
  }
}

function getTicketTitle(
  ticket: AdminSupportTicket,
): string {
  return (
    ticket.subject?.trim() ||
    "Support Request"
  );
}

function getTicketPreview(
  ticket: AdminSupportTicket,
): string {
  const messages =
    ticket.messages ?? [];

  if (
    messages.length === 0
  ) {
    return "No message";
  }

  const latestMessage =
    messages[
      messages.length - 1
    ];

  return (
    latestMessage?.message?.trim() ||
    "No message"
  );
}

function getPlayerName(
  ticket: AdminSupportTicket,
): string {
  return (
    ticket.user?.fullName?.trim() ||
    ticket.user?.username?.trim() ||
    ticket.user?.phone?.trim() ||
    ticket.userId
  );
}

/* ============================================================
   MESSAGE BUBBLE
============================================================ */

type MessageBubbleProps = {
  message: AdminSupportMessage;
};

function MessageBubble({
  message,
}: MessageBubbleProps) {
  const isAdmin =
    message.senderType ===
    "ADMIN";

  const isAI =
    message.senderType ===
    "AI";

  const senderName =
    isAdmin
      ? "Admin"
      : isAI
        ? "AI Assistant"
        : "Player";

  const SenderIcon =
    isAdmin
      ? CheckCircle2
      : isAI
        ? Bot
        : User;

  return (
    <div
      className={`flex w-full ${
        isAdmin
          ? "justify-end"
          : "justify-start"
      }`}
    >
      <div
        className={`flex max-w-[92%] flex-col sm:max-w-[78%] ${
          isAdmin
            ? "items-end"
            : "items-start"
        }`}
      >
        <div className="mb-1 flex items-center gap-1.5 px-1 text-xs font-medium text-slate-500">
          <SenderIcon className="h-3.5 w-3.5" />

          <span>
            {senderName}
          </span>

          {isAI && (
            <span className="rounded-full bg-violet-50 px-1.5 py-0.5 text-[9px] font-bold text-violet-600">
              AI
            </span>
          )}
        </div>

        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
            isAdmin
              ? "rounded-br-md bg-blue-600 text-white"
              : isAI
                ? "rounded-tl-md border border-violet-100 bg-violet-50 text-violet-950"
                : "rounded-tl-md border border-slate-200 bg-white text-slate-700"
          }`}
        >
          <p className="whitespace-pre-wrap break-words">
            {message.message}
          </p>
        </div>

        <span className="mt-1 px-1 text-[10px] text-slate-400">
          {formatDateTime(
            message.createdAt,
          )}
        </span>
      </div>
    </div>
  );
}

/* ============================================================
   LOADING STATE
============================================================ */

function LoadingState() {
  return (
    <div className="flex min-h-[350px] items-center justify-center">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />

        Loading support tickets...
      </div>
    </div>
  );
}

/* ============================================================
   EMPTY STATE
============================================================ */

function EmptyState() {
  return (
    <div className="flex min-h-[350px] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <MessageCircle className="h-6 w-6" />
      </div>

      <h3 className="mt-4 text-sm font-bold text-slate-800">
        No support tickets
      </h3>

      <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
        There are no support tickets matching the
        current filters.
      </p>
    </div>
  );
}

/* ============================================================
   COMPONENT
============================================================ */

export default function CustomerSupport() {
  /* ==========================================================
     TICKETS
  ========================================================== */

  const [
    tickets,
    setTickets,
  ] = useState<
    AdminSupportTicket[]
  >([]);

  const [
    selectedTicket,
    setSelectedTicket,
  ] =
    useState<AdminSupportTicket | null>(
      null,
    );

  /* ==========================================================
     LOADING
  ========================================================== */

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    loadingTicket,
    setLoadingTicket,
  ] = useState(false);

  const [
    sending,
    setSending,
  ] = useState(false);

  const [
    updating,
    setUpdating,
  ] = useState(false);

  /* ==========================================================
     FILTERS
  ========================================================== */

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<
      SupportTicketStatus | "ALL"
    >("ALL");

  const [
    priorityFilter,
    setPriorityFilter,
  ] =
    useState<
      SupportTicketPriority | "ALL"
    >("ALL");

  const [
    search,
    setSearch,
  ] = useState("");

  /* ==========================================================
     MESSAGE
  ========================================================== */

  const [
    replyMessage,
    setReplyMessage,
  ] = useState("");

  const replyInputRef =
    useRef<HTMLTextAreaElement | null>(
      null,
    );

  /* ==========================================================
     ERROR / NOTICE
  ========================================================== */

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  const [
    notice,
    setNotice,
  ] = useState<string | null>(
    null,
  );

  /* ==========================================================
     MOBILE
  ========================================================== */

  const [
    mobileShowDetail,
    setMobileShowDetail,
  ] = useState(false);

  /* ==========================================================
     AI SETTINGS
  ========================================================== */

  const [
    aiEnabled,
    setAiEnabled,
  ] = useState(true);

  const [
    aiSettingsLoading,
    setAiSettingsLoading,
  ] = useState(true);

  const [
    aiSettingsSaving,
    setAiSettingsSaving,
  ] = useState(false);

  const [
    aiSettingsUpdatedAt,
    setAiSettingsUpdatedAt,
  ] = useState<
    string | null
  >(null);

  /* ==========================================================
     LOAD AI SETTINGS
  ========================================================== */

  const loadAISettings =
    useCallback(
      async () => {
        try {
          setAiSettingsLoading(
            true,
          );

          const response =
            await getAdminAISettings();

          if (
            !response.success ||
            !response.settings
          ) {
            throw new Error(
              response.message ??
                "Unable to load AI support settings.",
            );
          }

          setAiEnabled(
            response.settings.enabled,
          );

          setAiSettingsUpdatedAt(
            response.settings
              .updatedAt,
          );
        } catch (err) {
          console.error(
            "Load AI support settings error:",
            err,
          );

          /*
           * Do not change the current
           * UI state on failure.
           */

          setError(
            err instanceof Error
              ? err.message
              : "Unable to load AI support settings.",
          );
        } finally {
          setAiSettingsLoading(
            false,
          );
        }
      },
      [],
    );

  /* ==========================================================
     SAVE AI SETTINGS
  ========================================================== */

  const handleAIToggle =
    async () => {
      if (
        aiSettingsSaving ||
        aiSettingsLoading
      ) {
        return;
      }

      const nextValue =
        !aiEnabled;

      const previousValue =
        aiEnabled;

      /*
       * Optimistic UI.
       */

      setAiEnabled(
        nextValue,
      );

      setAiSettingsSaving(
        true,
      );

      setError(null);
      setNotice(null);

      try {
        const response =
          await updateAdminAISettings(
            nextValue,
          );

        if (
          !response.success ||
          !response.settings
        ) {
          throw new Error(
            response.message ??
              "Unable to update AI support settings.",
          );
        }

        setAiEnabled(
          response.settings.enabled,
        );

        setAiSettingsUpdatedAt(
          response.settings
            .updatedAt,
        );

        setNotice(
          response.settings.enabled
            ? "AI support has been enabled."
            : "AI support has been disabled.",
        );
      } catch (err) {
        console.error(
          "Update AI support settings error:",
          err,
        );

        /*
         * Roll back optimistic state.
         */

        setAiEnabled(
          previousValue,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to update AI support settings.",
        );
      } finally {
        setAiSettingsSaving(
          false,
        );
      }
    };

  /* ==========================================================
     LOAD TICKETS
  ========================================================== */

  const loadTickets =
    useCallback(
      async (
        showLoading = true,
      ) => {
        try {
          if (
            showLoading
          ) {
            setLoading(true);
          } else {
            setRefreshing(
              true,
            );
          }

          setError(null);

          const response =
            await getAdminSupportTickets(
              {
                status:
                  statusFilter ===
                  "ALL"
                    ? undefined
                    : statusFilter,

                priority:
                  priorityFilter ===
                  "ALL"
                    ? undefined
                    : priorityFilter,

                search:
                  search.trim() ||
                  undefined,
              },
            );

          if (
            !response.success
          ) {
            throw new Error(
              response.message ??
                "Unable to load support tickets.",
            );
          }

          setTickets(
            Array.isArray(
              response.tickets,
            )
              ? response.tickets
              : [],
          );
        } catch (err) {
          console.error(
            "Load support tickets error:",
            err,
          );

          setTickets([]);

          setError(
            err instanceof Error
              ? err.message
              : "Unable to load support tickets.",
          );
        } finally {
          setLoading(false);
          setRefreshing(
            false,
          );
        }
      },
      [
        priorityFilter,
        search,
        statusFilter,
      ],
    );

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    void loadTickets(true);
  }, [loadTickets]);

  useEffect(() => {
    void loadAISettings();
  }, [loadAISettings]);

  /* ==========================================================
     CLEAR NOTICE
  ========================================================== */

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          setNotice(null);
        },
        4000,
      );

    return () =>
      window.clearTimeout(
        timer,
      );
  }, [notice]);

  /* ==========================================================
     SELECT TICKET
  ========================================================== */

  const handleSelectTicket =
    async (
      ticket: AdminSupportTicket,
    ) => {
      setError(null);

      setMobileShowDetail(
        true,
      );

      /*
       * Immediately show the list
       * version while loading detail.
       */

      setSelectedTicket(
        ticket,
      );

      setLoadingTicket(
        true,
      );

      try {
        const response =
          await getAdminSupportTicket(
            ticket.id,
          );

        if (
          !response.success ||
          !response.ticket
        ) {
          throw new Error(
            response.message ??
              "Unable to load support ticket.",
          );
        }

        setSelectedTicket(
          response.ticket,
        );

        /*
         * Keep list item synchronized.
         */

        setTickets(
          (previous) =>
            previous.map(
              (item) =>
                item.id ===
                response.ticket!.id
                  ? response.ticket!
                  : item,
            ),
        );
      } catch (err) {
        console.error(
          "Load support ticket error:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load support ticket.",
        );
      } finally {
        setLoadingTicket(
          false,
        );
      }
    };

  /* ==========================================================
     REFRESH
  ========================================================== */

  const handleRefresh =
    async () => {
      await Promise.all([
        loadTickets(false),
        loadAISettings(),
      ]);

      if (
        selectedTicket
      ) {
        try {
          const response =
            await getAdminSupportTicket(
              selectedTicket.id,
            );

          if (
            response.success &&
            response.ticket
          ) {
            setSelectedTicket(
              response.ticket,
            );
          }
        } catch {
          /*
           * Main ticket list refresh
           * has already completed.
           */
        }
      }
    };

  /* ==========================================================
     REPLY
  ========================================================== */

  const handleReply =
    async () => {
      if (
        !selectedTicket ||
        sending
      ) {
        return;
      }

      const trimmed =
        replyMessage.trim();

      if (!trimmed) {
        return;
      }

      if (
        trimmed.length > 5000
      ) {
        setError(
          "Reply must be 5000 characters or less.",
        );

        return;
      }

      setSending(true);
      setError(null);
      setNotice(null);

      try {
        const response =
          await replyToSupportTicket(
            selectedTicket.id,
            trimmed,
          );

        if (
          !response.success
        ) {
          throw new Error(
            response.message ??
              "Unable to send reply.",
          );
        }

        setReplyMessage("");

        /*
         * Reload the ticket so the
         * conversation remains the
         * database source of truth.
         */

        const detail =
          await getAdminSupportTicket(
            selectedTicket.id,
          );

        if (
          detail.success &&
          detail.ticket
        ) {
          setSelectedTicket(
            detail.ticket,
          );

          setTickets(
            (previous) =>
              previous.map(
                (item) =>
                  item.id ===
                  detail.ticket!.id
                    ? detail.ticket!
                    : item,
              ),
          );
        }

        setNotice(
          "Reply sent successfully.",
        );

        window.setTimeout(
          () => {
            replyInputRef.current?.focus();
          },
          0,
        );
      } catch (err) {
        console.error(
          "Reply support ticket error:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to send reply.",
        );
      } finally {
        setSending(false);
      }
    };

  /* ==========================================================
     STATUS UPDATE
  ========================================================== */

  const handleStatusChange =
    async (
      status: SupportTicketStatus,
    ) => {
      if (
        !selectedTicket ||
        updating
      ) {
        return;
      }

      setUpdating(true);
      setError(null);
      setNotice(null);

      try {
        const response =
          await updateSupportTicketStatus(
            selectedTicket.id,
            status,
          );

        if (
          !response.success
        ) {
          throw new Error(
            response.message ??
              "Unable to update ticket status.",
          );
        }

        setSelectedTicket(
          (previous) =>
            previous
              ? {
                  ...previous,

                  status,

                  updatedAt:
                    response.ticket
                      ?.updatedAt ??
                    new Date().toISOString(),
                }
              : previous,
        );

        setTickets(
          (previous) =>
            previous.map(
              (ticket) =>
                ticket.id ===
                selectedTicket.id
                  ? {
                      ...ticket,

                      status,

                      updatedAt:
                        response.ticket
                          ?.updatedAt ??
                        new Date().toISOString(),
                    }
                  : ticket,
            ),
        );

        setNotice(
          `Ticket status changed to ${getStatusLabel(
            status,
          )}.`,
        );
      } catch (err) {
        console.error(
          "Update ticket status error:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to update ticket status.",
        );
      } finally {
        setUpdating(false);
      }
    };

  /* ==========================================================
     PRIORITY UPDATE
  ========================================================== */

  const handlePriorityChange =
    async (
      priority: SupportTicketPriority,
    ) => {
      if (
        !selectedTicket ||
        updating
      ) {
        return;
      }

      setUpdating(true);
      setError(null);
      setNotice(null);

      try {
        const response =
          await updateSupportTicketPriority(
            selectedTicket.id,
            priority,
          );

        if (
          !response.success
        ) {
          throw new Error(
            response.message ??
              "Unable to update ticket priority.",
          );
        }

        setSelectedTicket(
          (previous) =>
            previous
              ? {
                  ...previous,

                  priority,

                  updatedAt:
                    response.ticket
                      ?.updatedAt ??
                    new Date().toISOString(),
                }
              : previous,
        );

        setTickets(
          (previous) =>
            previous.map(
              (ticket) =>
                ticket.id ===
                selectedTicket.id
                  ? {
                      ...ticket,

                      priority,

                      updatedAt:
                        response.ticket
                          ?.updatedAt ??
                        new Date().toISOString(),
                    }
                  : ticket,
            ),
        );

        setNotice(
          `Priority changed to ${getPriorityLabel(
            priority,
          )}.`,
        );
      } catch (err) {
        console.error(
          "Update ticket priority error:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to update ticket priority.",
        );
      } finally {
        setUpdating(false);
      }
    };

  /* ==========================================================
     COUNTS
  ========================================================== */

  const openCount =
    useMemo(
      () =>
        tickets.filter(
          (ticket) =>
            ticket.status ===
            "OPEN",
        ).length,
      [tickets],
    );

  const inProgressCount =
    useMemo(
      () =>
        tickets.filter(
          (ticket) =>
            ticket.status ===
            "IN_PROGRESS",
        ).length,
      [tickets],
    );

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="min-w-0 space-y-5">
      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <MessageCircle className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                Customer Support
              </h1>

              <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                Manage player support conversations and
                automated AI assistance.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              refreshing
                ? "animate-spin"
                : ""
            }`}
          />

          Refresh
        </button>
      </div>

      {/* ======================================================
          AI SUPPORT SETTINGS
      ====================================================== */}

      <section className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm">
        <div className="h-1 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600" />

        <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                aiEnabled
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              <Bot className="h-5 w-5" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-extrabold text-slate-900">
                  AI Support
                </h2>

                <span
                  className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-wide ${
                    aiEnabled
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {aiEnabled
                    ? "Enabled"
                    : "Disabled"}
                </span>
              </div>

              <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
                Controls whether player AI support requests can
                use the automated support pipeline. When enabled,
                OpenRouter can be used and the local training
                fallback can continue to answer when the external
                AI service is unavailable.
              </p>

              {aiSettingsUpdatedAt && (
                <p className="mt-1.5 text-[10px] text-slate-400">
                  Last changed:{" "}
                  {formatDateTime(
                    aiSettingsUpdatedAt,
                  )}
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <span
              className={`hidden text-xs font-semibold sm:inline ${
                aiEnabled
                  ? "text-emerald-600"
                  : "text-slate-500"
              }`}
            >
              {aiEnabled
                ? "AI Support ON"
                : "AI Support OFF"}
            </span>

            <button
              type="button"
              role="switch"
              aria-checked={aiEnabled}
              aria-label="Toggle AI support"
              disabled={
                aiSettingsLoading ||
                aiSettingsSaving
              }
              onClick={
                handleAIToggle
              }
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${
                aiEnabled
                  ? "bg-emerald-500"
                  : "bg-slate-300"
              } ${
                aiSettingsLoading ||
                aiSettingsSaving
                  ? "cursor-not-allowed opacity-60"
                  : "cursor-pointer"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition ${
                  aiEnabled
                    ? "translate-x-6"
                    : "translate-x-1"
                }`}
              />

              {aiSettingsSaving && (
                <Loader2 className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 animate-spin text-slate-500" />
              )}
            </button>
          </div>
        </div>
      </section>

      {/* ======================================================
          ALERTS
      ====================================================== */}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />

          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-red-700">
              Something went wrong
            </p>

            <p className="mt-0.5 text-xs leading-5 text-red-600">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setError(null)
            }
            className="text-red-400 hover:text-red-600"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {notice && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />

          <p className="flex-1 text-xs font-medium text-emerald-700">
            {notice}
          </p>

          <button
            type="button"
            onClick={() =>
              setNotice(null)
            }
            className="text-emerald-400 hover:text-emerald-600"
            aria-label="Dismiss notice"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ======================================================
          SUMMARY
      ====================================================== */}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-blue-500" />

            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Total
            </span>
          </div>

          <p className="mt-1 text-xl font-extrabold text-slate-900">
            {tickets.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-blue-500" />

            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Open
            </span>
          </div>

          <p className="mt-1 text-xl font-extrabold text-blue-600">
            {openCount}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />

            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              In Progress
            </span>
          </div>

          <p className="mt-1 text-xl font-extrabold text-amber-600">
            {inProgressCount}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-violet-500" />

            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              AI
            </span>
          </div>

          <p
            className={`mt-1 text-sm font-extrabold ${
              aiEnabled
                ? "text-emerald-600"
                : "text-slate-400"
            }`}
          >
            {aiEnabled
              ? "Enabled"
              : "Disabled"}
          </p>
        </div>
      </div>

      {/* ======================================================
          FILTERS
      ====================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
          {/* SEARCH */}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search ticket, player, subject..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* STATUS */}

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target
                  .value as
                  | SupportTicketStatus
                  | "ALL",
              )
            }
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          >
            {STATUS_FILTERS.map(
              (status) => (
                <option
                  key={status}
                  value={status}
                >
                  {status === "ALL"
                    ? "All Status"
                    : getStatusLabel(
                        status,
                      )}
                </option>
              ),
            )}
          </select>

          {/* PRIORITY */}

          <select
            value={priorityFilter}
            onChange={(event) =>
              setPriorityFilter(
                event.target
                  .value as
                  | SupportTicketPriority
                  | "ALL",
              )
            }
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          >
            {PRIORITY_FILTERS.map(
              (priority) => (
                <option
                  key={priority}
                  value={priority}
                >
                  {priority ===
                  "ALL"
                    ? "All Priority"
                    : getPriorityLabel(
                        priority,
                      )}
                </option>
              ),
            )}
          </select>
        </div>
      </section>

      {/* ======================================================
          MAIN SUPPORT AREA
      ====================================================== */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid min-h-[680px] lg:grid-cols-[360px_minmax(0,1fr)]">
          {/* ====================================================
              TICKET LIST
          ==================================================== */}

          <aside
            className={`min-w-0 border-r border-slate-200 ${
              mobileShowDetail
                ? "hidden lg:block"
                : "block"
            }`}
          >
            <div className="border-b border-slate-200 px-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Support Tickets
                  </h2>

                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {tickets.length} ticket
                    {tickets.length ===
                    1
                      ? ""
                      : "s"}
                  </p>
                </div>

                <ShieldCheck className="h-4 w-4 text-emerald-500" />
              </div>
            </div>

            {loading ? (
              <LoadingState />
            ) : tickets.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="divide-y divide-slate-100">
                {tickets.map(
                  (ticket) => {
                    const selected =
                      selectedTicket?.id ===
                      ticket.id;

                    return (
                      <button
                        key={
                          ticket.id
                        }
                        type="button"
                        onClick={() =>
                          void handleSelectTicket(
                            ticket,
                          )
                        }
                        className={`w-full px-4 py-4 text-left transition ${
                          selected
                            ? "bg-indigo-50/70"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                              ticket.status ===
                              "OPEN"
                                ? "bg-blue-50 text-blue-600"
                                : ticket.status ===
                                    "IN_PROGRESS"
                                  ? "bg-amber-50 text-amber-600"
                                  : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            <MessageCircle className="h-4 w-4" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="truncate text-xs font-bold text-slate-900">
                                {getTicketTitle(
                                  ticket,
                                )}
                              </p>

                              <span className="shrink-0 text-[9px] text-slate-400">
                                {formatDateTime(
                                  ticket.updatedAt,
                                )}
                              </span>
                            </div>

                            <p className="mt-1 truncate text-[10px] font-medium text-slate-500">
                              {getPlayerName(
                                ticket,
                              )}
                            </p>

                            <p className="mt-1.5 line-clamp-2 text-[10px] leading-4 text-slate-400">
                              {getTicketPreview(
                                ticket,
                              )}
                            </p>

                            <div className="mt-3 flex items-center justify-between gap-2">
                              <div className="flex min-w-0 items-center gap-1.5">
                                <span
                                  className={`rounded-full px-2 py-1 text-[9px] font-bold ring-1 ring-inset ${getPriorityClassName(
                                    ticket.priority,
                                  )}`}
                                >
                                  {getPriorityLabel(
                                    ticket.priority,
                                  )}
                                </span>

                                {ticket.messages &&
                                  ticket.messages
                                    .length >
                                    0 && (
                                    <span className="truncate text-[9px] text-slate-400">
                                      {
                                        ticket
                                          .messages
                                          .length
                                      }{" "}
                                      msg
                                    </span>
                                  )}
                              </div>

                              <span
                                className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-bold ring-1 ring-inset ${getStatusClassName(
                                  ticket.status,
                                )}`}
                              >
                                {getStatusLabel(
                                  ticket.status,
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  },
                )}
              </div>
            )}
          </aside>

          {/* ====================================================
              DETAIL
          ==================================================== */}

          <section
            className={`min-w-0 ${
              mobileShowDetail
                ? "block"
                : "hidden lg:block"
            }`}
          >
            {!selectedTicket ? (
              <div className="flex min-h-[680px] items-center justify-center px-6">
                <div className="max-w-md text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                    <MessageCircle className="h-8 w-8 text-slate-400" />
                  </div>

                  <h3 className="mt-4 text-lg font-semibold text-slate-900">
                    Select a support ticket
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Select a ticket from the list to view the
                    conversation and respond to the player.
                  </p>

                  <div className="mt-6 rounded-xl border border-violet-100 bg-violet-50 p-4 text-left">
                    <div className="flex items-start gap-3">
                      <Bot className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />

                      <div>
                        <p className="text-sm font-semibold text-violet-900">
                          Automated Support
                        </p>

                        <p className="mt-1 text-xs leading-5 text-violet-700">
                          AI Assistant messages can come from
                          OpenRouter or the local training
                          fallback. Conversations that require
                          human assistance can be handled here.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[680px] flex-col">
                {/* ============================================
                    DETAIL HEADER
                ============================================ */}

                <div className="border-b border-slate-200 px-4 py-4 sm:px-6">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setMobileShowDetail(
                          false,
                        )
                      }
                      className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 lg:hidden"
                      aria-label="Back to support tickets"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-base font-bold text-slate-900 sm:text-lg">
                          {getTicketTitle(
                            selectedTicket,
                          )}
                        </h2>

                        <span
                          className={`rounded-full px-2 py-1 text-[9px] font-bold ring-1 ring-inset ${getStatusClassName(
                            selectedTicket.status,
                          )}`}
                        >
                          {getStatusLabel(
                            selectedTicket.status,
                          )}
                        </span>

                        <span
                          className={`rounded-full px-2 py-1 text-[9px] font-bold ring-1 ring-inset ${getPriorityClassName(
                            selectedTicket.priority,
                          )}`}
                        >
                          {getPriorityLabel(
                            selectedTicket.priority,
                          )}
                        </span>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                        <span>
                          {getPlayerName(
                            selectedTicket,
                          )}
                        </span>

                        <span>
                          •
                        </span>

                        <span>
                          Created{" "}
                          {formatDateTime(
                            selectedTicket.createdAt,
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ==========================================
                      CONTROLS
                  ========================================== */}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <Settings2 className="h-3.5 w-3.5 text-slate-400" />

                      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Status
                      </span>

                      <select
                        value={
                          selectedTicket.status
                        }
                        disabled={
                          updating
                        }
                        onChange={(
                          event,
                        ) =>
                          void handleStatusChange(
                            event.target
                              .value as SupportTicketStatus,
                          )
                        }
                        className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-700 outline-none focus:border-indigo-400"
                      >
                        <option value="OPEN">
                          Open
                        </option>

                        <option value="IN_PROGRESS">
                          In Progress
                        </option>

                        <option value="RESOLVED">
                          Resolved
                        </option>

                        <option value="CLOSED">
                          Closed
                        </option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Priority
                      </span>

                      <select
                        value={
                          selectedTicket.priority ??
                          "NORMAL"
                        }
                        disabled={
                          updating
                        }
                        onChange={(
                          event,
                        ) =>
                          void handlePriorityChange(
                            event.target
                              .value as SupportTicketPriority,
                          )
                        }
                        className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-700 outline-none focus:border-indigo-400"
                      >
                        <option value="URGENT">
                          Urgent
                        </option>

                        <option value="HIGH">
                          High
                        </option>

                        <option value="NORMAL">
                          Normal
                        </option>

                        <option value="LOW">
                          Low
                        </option>
                      </select>
                    </div>

                    {updating && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500" />
                    )}
                  </div>
                </div>

                {/* ==========================================
                    MESSAGES
                ========================================== */}

                <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/60 px-4 py-5 sm:px-6">
                  {loadingTicket ? (
                    <div className="flex min-h-[420px] items-center justify-center">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Loader2 className="h-4 w-4 animate-spin" />

                        Loading conversation...
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {(selectedTicket.messages ??
                        []).length ===
                      0 ? (
                        <div className="flex min-h-[350px] items-center justify-center">
                          <p className="text-xs text-slate-400">
                            No messages in this ticket.
                          </p>
                        </div>
                      ) : (
                        (
                          selectedTicket.messages ??
                          []
                        ).map(
                          (
                            message,
                          ) => (
                            <MessageBubble
                              key={
                                message.id
                              }
                              message={
                                message
                              }
                            />
                          ),
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* ==========================================
                    REPLY
                ========================================== */}

                <div className="border-t border-slate-200 bg-white p-4 sm:p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <UserRound className="h-3.5 w-3.5 text-blue-500" />

                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Admin Reply
                    </span>
                  </div>

                  <div className="flex items-end gap-2">
                    <textarea
                      ref={
                        replyInputRef
                      }
                      value={
                        replyMessage
                      }
                      disabled={
                        sending
                      }
                      onChange={(
                        event,
                      ) =>
                        setReplyMessage(
                          event.target
                            .value,
                        )
                      }
                      onKeyDown={(
                        event,
                      ) => {
                        if (
                          event.key ===
                            "Enter" &&
                          !event.shiftKey
                        ) {
                          event.preventDefault();

                          void handleReply();
                        }
                      }}
                      maxLength={5000}
                      rows={3}
                      placeholder="Write a reply to the player..."
                      className="min-h-[84px] flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs leading-5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        void handleReply()
                      }
                      disabled={
                        sending ||
                        !replyMessage.trim()
                      }
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Send reply"
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-[9px] text-slate-400">
                      Press Enter to send · Shift + Enter
                      for a new line
                    </p>

                    <span className="text-[9px] text-slate-400">
                      {replyMessage.length}/5000
                    </span>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}