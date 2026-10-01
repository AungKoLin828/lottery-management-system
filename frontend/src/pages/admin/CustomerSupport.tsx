import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Bot,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  Loader2,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  User,
  XCircle,
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

/*
 * ============================================================
 * HELPERS
 * ============================================================
 */

function formatDateTime(
  value?: string | Date | null,
): string {
  if (!value) {
    return "";
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
}

function getStatusLabel(
  status?: SupportTicketStatus | null,
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
      return "Unknown";
  }
}

function getPriorityLabel(
  priority?: SupportTicketPriority | null,
): string {
  switch (priority) {
    case "LOW":
      return "Low";

    case "NORMAL":
      return "Normal";

    case "HIGH":
      return "High";

    case "URGENT":
      return "Urgent";

    default:
      return "Normal";
  }
}

function getStatusClassName(
  status?: SupportTicketStatus | null,
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

/*
 * Ticket subject comes directly from AdminSupportTicket.subject.
 */
function getTicketTitle(
  ticket: AdminSupportTicket,
): string {
  return ticket.subject?.trim() || "Support Request";
}

/*
 * Ticket list does not have a top-level "message" property.
 *
 * The latest message is taken from ticket.messages.
 */
function getTicketPreview(
  ticket: AdminSupportTicket,
): string {
  const messages =
    ticket.messages ?? [];

  if (messages.length === 0) {
    return "No message";
  }

  const latestMessage =
    messages[messages.length - 1];

  return (
    latestMessage?.message?.trim() ||
    "No message"
  );
}

/*
 * ============================================================
 * MESSAGE BUBBLE
 * ============================================================
 */

type MessageBubbleProps = {
  message: AdminSupportMessage;
};

function MessageBubble({
  message,
}: MessageBubbleProps) {
  const isAdmin =
    message.senderType === "ADMIN";

  const isAI =
    message.senderType === "AI";

  const senderName = isAdmin
    ? "Admin"
    : isAI
      ? "AI Assistant"
      : "Player";

  const SenderIcon = isAdmin
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
        </div>

        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
            isAdmin
              ? "rounded-br-md bg-blue-600 text-white"
              : isAI
                ? "rounded-bl-md border border-violet-200 bg-violet-50 text-slate-800"
                : "rounded-bl-md border border-slate-200 bg-white text-slate-800"
          }`}
        >
          <p className="whitespace-pre-wrap break-words">
            {message.message}
          </p>
        </div>

        <span className="mt-1 px-1 text-[11px] text-slate-400">
          {formatDateTime(
            message.createdAt,
          )}
        </span>
      </div>
    </div>
  );
}

/*
 * ============================================================
 * MAIN PAGE
 * ============================================================
 */

export default function CustomerSupport() {
  const [
    tickets,
    setTickets,
  ] = useState<AdminSupportTicket[]>(
    [],
  );

  const [
    selectedTicket,
    setSelectedTicket,
  ] =
    useState<AdminSupportTicket | null>(
      null,
    );

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<
    SupportTicketStatus | "ALL"
  >("ALL");

  const [
    priorityFilter,
    setPriorityFilter,
  ] = useState<
    SupportTicketPriority | "ALL"
  >("ALL");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    replyMessage,
    setReplyMessage,
  ] = useState("");

  const [
    loadingTickets,
    setLoadingTickets,
  ] = useState(false);

  const [
    loadingTicket,
    setLoadingTicket,
  ] = useState(false);

  const [
    sendingReply,
    setSendingReply,
  ] = useState(false);

  const [
    updatingStatus,
    setUpdatingStatus,
  ] = useState(false);

  const [
    updatingPriority,
    setUpdatingPriority,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  const [
    mobileShowDetail,
    setMobileShowDetail,
  ] = useState(false);

  /*
   * ==========================================================
   * LOAD TICKETS
   * ==========================================================
   */

  const loadTickets =
    useCallback(async () => {
      try {
        setLoadingTickets(true);
        setError(null);

        const params: {
          status?: SupportTicketStatus;
          priority?: SupportTicketPriority;
          search?: string;
        } = {};

        if (
          statusFilter !== "ALL"
        ) {
          params.status =
            statusFilter;
        }

        if (
          priorityFilter !== "ALL"
        ) {
          params.priority =
            priorityFilter;
        }

        const trimmedSearch =
          search.trim();

        if (trimmedSearch) {
          params.search =
            trimmedSearch;
        }

        const response =
          await getAdminSupportTickets(
            params,
          );

        /*
         * AdminSupportTicketListResponse:
         *
         * {
         *   success: boolean;
         *   tickets: AdminSupportTicket[];
         *   total?: number;
         *   message?: string;
         * }
         */
        setTickets(
          response.tickets ?? [],
        );
      } catch (err) {
        console.error(
          "Failed to load support tickets:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load support tickets.",
        );
      } finally {
        setLoadingTickets(false);
      }
    }, [
      statusFilter,
      priorityFilter,
      search,
    ]);

  /*
   * ==========================================================
   * LOAD SINGLE TICKET
   * ==========================================================
   */

  const loadTicket =
    useCallback(
      async (ticketId: string) => {
        try {
          setLoadingTicket(true);
          setError(null);

          const response =
            await getAdminSupportTicket(
              ticketId,
            );

          /*
           * AdminSupportTicketResponse:
           *
           * {
           *   success: boolean;
           *   ticket?: AdminSupportTicket;
           *   message?: string;
           * }
           */
          setSelectedTicket(
            response.ticket ?? null,
          );
        } catch (err) {
          console.error(
            "Failed to load support ticket:",
            err,
          );

          setError(
            err instanceof Error
              ? err.message
              : "Failed to load support ticket.",
          );
        } finally {
          setLoadingTicket(false);
        }
      },
      [],
    );

  /*
   * ==========================================================
   * INITIAL / FILTER LOAD
   * ==========================================================
   */

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  /*
   * ==========================================================
   * SELECT TICKET
   * ==========================================================
   */

  const handleSelectTicket =
    async (
      ticket: AdminSupportTicket,
    ) => {
      setMobileShowDetail(true);

      /*
       * AdminSupportTicket.id is already string.
       */
      await loadTicket(
        ticket.id,
      );
    };

  /*
   * ==========================================================
   * REFRESH
   * ==========================================================
   */

  const handleRefresh =
    async () => {
      await loadTickets();

      if (selectedTicket?.id) {
        await loadTicket(
          selectedTicket.id,
        );
      }
    };

  /*
   * ==========================================================
   * ADMIN REPLY
   * ==========================================================
   */

  const handleReply =
    async () => {
      if (!selectedTicket?.id) {
        return;
      }

      const message =
        replyMessage.trim();

      if (!message) {
        return;
      }

      try {
        setSendingReply(true);
        setError(null);

        await replyToSupportTicket(
          selectedTicket.id,
          message,
        );

        setReplyMessage("");

        await loadTicket(
          selectedTicket.id,
        );

        await loadTickets();
      } catch (err) {
        console.error(
          "Failed to send support reply:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to send support reply.",
        );
      } finally {
        setSendingReply(false);
      }
    };

  /*
   * ==========================================================
   * STATUS
   * ==========================================================
   */

  const handleStatusChange =
    async (
      status: SupportTicketStatus,
    ) => {
      if (!selectedTicket?.id) {
        return;
      }

      try {
        setUpdatingStatus(true);
        setError(null);

        await updateSupportTicketStatus(
          selectedTicket.id,
          status,
        );

        await loadTicket(
          selectedTicket.id,
        );

        await loadTickets();
      } catch (err) {
        console.error(
          "Failed to update support ticket status:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to update ticket status.",
        );
      } finally {
        setUpdatingStatus(false);
      }
    };

  /*
   * ==========================================================
   * PRIORITY
   * ==========================================================
   */

  const handlePriorityChange =
    async (
      priority: SupportTicketPriority,
    ) => {
      if (!selectedTicket?.id) {
        return;
      }

      try {
        setUpdatingPriority(true);
        setError(null);

        await updateSupportTicketPriority(
          selectedTicket.id,
          priority,
        );

        await loadTicket(
          selectedTicket.id,
        );

        await loadTickets();
      } catch (err) {
        console.error(
          "Failed to update support ticket priority:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to update ticket priority.",
        );
      } finally {
        setUpdatingPriority(false);
      }
    };

  /*
   * ==========================================================
   * COUNTS
   * ==========================================================
   */

  const counts = useMemo(() => {
    return {
      total: tickets.length,

      open: tickets.filter(
        (ticket) =>
          ticket.status ===
          "OPEN",
      ).length,

      inProgress: tickets.filter(
        (ticket) =>
          ticket.status ===
          "IN_PROGRESS",
      ).length,

      resolved: tickets.filter(
        (ticket) =>
          ticket.status ===
          "RESOLVED",
      ).length,
    };
  }, [tickets]);

  /*
   * ==========================================================
   * CURRENT MESSAGES
   * ==========================================================
   */

  const messages =
    selectedTicket?.messages ?? [];

  /*
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-[1600px] px-3 py-4 sm:px-5 lg:px-6">
        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                <MessageCircle className="h-5 w-5" />
              </div>

              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  Customer Support
                </h1>

                <p className="text-sm text-slate-500">
                  Manage player, automated AI,
                  and human support
                  conversations.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              void handleRefresh()
            }
            disabled={
              loadingTickets ||
              loadingTicket
            }
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loadingTickets ||
                loadingTicket
                  ? "animate-spin"
                  : ""
              }`}
            />

            Refresh
          </button>
        </div>

        {/* ================================================== */}
        {/* SUMMARY */}
        {/* ================================================== */}

        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Total
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {counts.total}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Open
            </p>

            <p className="mt-1 text-2xl font-bold text-blue-600">
              {counts.open}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              In Progress
            </p>

            <p className="mt-1 text-2xl font-bold text-amber-600">
              {counts.inProgress}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Resolved
            </p>

            <p className="mt-1 text-2xl font-bold text-emerald-600">
              {counts.resolved}
            </p>
          </div>
        </div>

        {/* ================================================== */}
        {/* ERROR */}
        {/* ================================================== */}

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <div className="flex-1">
              <p className="font-medium">
                Support operation failed
              </p>

              <p className="mt-0.5">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setError(null)
              }
              className="text-red-500 hover:text-red-700"
              aria-label="Dismiss error"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ================================================== */}
        {/* MAIN */}
        {/* ================================================== */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid min-h-[650px] grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)]">
            {/* ============================================== */}
            {/* TICKET LIST */}
            {/* ============================================== */}

            <aside
              className={`border-slate-200 lg:border-r ${
                mobileShowDetail
                  ? "hidden lg:block"
                  : "block"
              }`}
            >
              <div className="border-b border-slate-200 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-semibold text-slate-900">
                    Support Tickets
                  </h2>

                  {loadingTickets && (
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  )}
                </div>

                {/* SEARCH */}

                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value,
                      )
                    }
                    placeholder="Search tickets..."
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>

                {/* FILTERS */}

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <select
                    value={
                      statusFilter
                    }
                    onChange={(event) =>
                      setStatusFilter(
                        event.target
                          .value as
                          | SupportTicketStatus
                          | "ALL",
                      )
                    }
                    className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-blue-500"
                  >
                    <option value="ALL">
                      All Status
                    </option>

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

                  <select
                    value={
                      priorityFilter
                    }
                    onChange={(event) =>
                      setPriorityFilter(
                        event.target
                          .value as
                          | SupportTicketPriority
                          | "ALL",
                      )
                    }
                    className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-blue-500"
                  >
                    <option value="ALL">
                      All Priority
                    </option>

                    <option value="LOW">
                      Low
                    </option>

                    <option value="NORMAL">
                      Normal
                    </option>

                    <option value="HIGH">
                      High
                    </option>

                    <option value="URGENT">
                      Urgent
                    </option>
                  </select>
                </div>
              </div>

              {/* TICKETS */}

              <div className="max-h-[590px] overflow-y-auto">
                {loadingTickets &&
                tickets.length === 0 ? (
                  <div className="flex min-h-[300px] items-center justify-center">
                    <div className="flex flex-col items-center gap-2 text-sm text-slate-500">
                      <Loader2 className="h-6 w-6 animate-spin" />

                      <span>
                        Loading support
                        tickets...
                      </span>
                    </div>
                  </div>
                ) : tickets.length ===
                  0 ? (
                  <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
                    <MessageCircle className="mb-3 h-10 w-10 text-slate-300" />

                    <p className="font-medium text-slate-700">
                      No support
                      tickets
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      Tickets created from
                      unresolved automated
                      support conversations
                      will appear here.
                    </p>
                  </div>
                ) : (
                  tickets.map(
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
                          className={`w-full border-b border-slate-100 px-4 py-4 text-left transition ${
                            selected
                              ? "bg-blue-50"
                              : "bg-white hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-slate-900">
                                {getTicketTitle(
                                  ticket,
                                )}
                              </p>

                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                                {getTicketPreview(
                                  ticket,
                                )}
                              </p>
                            </div>

                            <span
                              className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ring-1 ring-inset ${getStatusClassName(
                                ticket.status,
                              )}`}
                            >
                              {getStatusLabel(
                                ticket.status,
                              )}
                            </span>
                          </div>

                          <div className="mt-3 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`rounded-full px-2 py-1 text-[10px] font-semibold ring-1 ring-inset ${getPriorityClassName(
                                  ticket.priority,
                                )}`}
                              >
                                {getPriorityLabel(
                                  ticket.priority,
                                )}
                              </span>

                              {ticket.messages &&
                                ticket
                                  .messages
                                  .length >
                                  0 && (
                                  <span className="text-[11px] text-slate-400">
                                    {
                                      ticket
                                        .messages
                                        .length
                                    }{" "}
                                    {ticket
                                      .messages
                                      .length ===
                                    1
                                      ? "message"
                                      : "messages"}
                                  </span>
                                )}
                            </div>

                            <span className="text-[11px] text-slate-400">
                              {formatDateTime(
                                ticket.createdAt,
                              )}
                            </span>
                          </div>
                        </button>
                      );
                    },
                  )
                )}
              </div>
            </aside>

            {/* ============================================== */}
            {/* DETAIL */}
            {/* ============================================== */}

            <section
              className={`min-w-0 ${
                mobileShowDetail
                  ? "block"
                  : "hidden lg:block"
              }`}
            >
              {!selectedTicket ? (
                <div className="flex min-h-[650px] items-center justify-center px-6">
                  <div className="max-w-md text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                      <MessageCircle className="h-8 w-8 text-slate-400" />
                    </div>

                    <h3 className="mt-4 text-lg font-semibold text-slate-900">
                      Select a support
                      ticket
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Select a ticket from
                      the list to view the
                      conversation and
                      respond to the player.
                    </p>

                    <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left">
                      <div className="flex items-start gap-3">
                        <Bot className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />

                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            Automated
                            support
                          </p>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            AI Assistant
                            messages can come
                            from automated AI
                            support or the
                            built-in support
                            knowledge fallback.
                            Unresolved
                            conversations can be
                            handled by an
                            administrator here.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-full min-h-[650px] flex-col">
                  {/* DETAIL HEADER */}

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
                          <h2 className="truncate text-base font-semibold text-slate-900 sm:text-lg">
                            {getTicketTitle(
                              selectedTicket,
                            )}
                          </h2>

                          <span
                            className={`rounded-full px-2 py-1 text-[10px] font-semibold ring-1 ring-inset ${getStatusClassName(
                              selectedTicket.status,
                            )}`}
                          >
                            {getStatusLabel(
                              selectedTicket.status,
                            )}
                          </span>

                          <span
                            className={`rounded-full px-2 py-1 text-[10px] font-semibold ring-1 ring-inset ${getPriorityClassName(
                              selectedTicket.priority,
                            )}`}
                          >
                            {getPriorityLabel(
                              selectedTicket.priority,
                            )}
                          </span>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                          <span>
                            Ticket #
                            {
                              selectedTicket.id
                            }
                          </span>

                          {selectedTicket.user && (
                            <>
                              <span>
                                Player:{" "}
                                {selectedTicket
                                  .user
                                  .fullName ||
                                  selectedTicket
                                    .user
                                    .username ||
                                  selectedTicket
                                    .user
                                    .phone ||
                                  selectedTicket
                                    .user
                                    .id}
                              </span>
                            </>
                          )}

                          <span>
                            Created{" "}
                            {formatDateTime(
                              selectedTicket.createdAt,
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* CONTROLS */}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <select
                        value={
                          selectedTicket.status
                        }
                        disabled={
                          updatingStatus
                        }
                        onChange={(event) =>
                          void handleStatusChange(
                            event.target
                              .value as SupportTicketStatus,
                          )
                        }
                        className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none focus:border-blue-500 disabled:opacity-60"
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

                      <select
                        value={
                          selectedTicket.priority
                        }
                        disabled={
                          updatingPriority
                        }
                        onChange={(event) =>
                          void handlePriorityChange(
                            event.target
                              .value as SupportTicketPriority,
                          )
                        }
                        className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none focus:border-blue-500 disabled:opacity-60"
                      >
                        <option value="LOW">
                          Low
                        </option>

                        <option value="NORMAL">
                          Normal
                        </option>

                        <option value="HIGH">
                          High
                        </option>

                        <option value="URGENT">
                          Urgent
                        </option>
                      </select>

                      {updatingStatus ||
                      updatingPriority ? (
                        <div className="inline-flex h-9 items-center gap-2 px-2 text-xs text-slate-400">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />

                          Updating...
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* MESSAGES */}

                  <div className="flex-1 overflow-y-auto bg-slate-50/70 px-4 py-5 sm:px-6">
                    {loadingTicket ? (
                      <div className="flex min-h-[300px] items-center justify-center">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Loader2 className="h-5 w-5 animate-spin" />

                          Loading conversation...
                        </div>
                      </div>
                    ) : messages.length ===
                      0 ? (
                      <div className="flex min-h-[300px] items-center justify-center">
                        <div className="text-center">
                          <Clock3 className="mx-auto h-8 w-8 text-slate-300" />

                          <p className="mt-3 text-sm font-medium text-slate-600">
                            No messages yet
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {messages.map(
                          (message) => (
                            <MessageBubble
                              key={
                                message.id
                              }
                              message={
                                message
                              }
                            />
                          ),
                        )}
                      </div>
                    )}
                  </div>

                  {/* REPLY */}

                  <div className="border-t border-slate-200 bg-white p-4 sm:p-5">
                    <div className="mb-2 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-600" />

                      <span className="text-xs font-semibold text-slate-700">
                        Admin Reply
                      </span>
                    </div>

                    <div className="flex items-end gap-2">
                      <textarea
                        value={
                          replyMessage
                        }
                        onChange={(event) =>
                          setReplyMessage(
                            event.target
                              .value,
                          )
                        }
                        onKeyDown={(event) => {
                          if (
                            event.key ===
                              "Enter" &&
                            !event.shiftKey
                          ) {
                            event.preventDefault();

                            if (
                              replyMessage.trim() &&
                              !sendingReply
                            ) {
                              void handleReply();
                            }
                          }
                        }}
                        rows={3}
                        maxLength={2000}
                        placeholder="Type your response..."
                        className="min-h-[80px] flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          void handleReply()
                        }
                        disabled={
                          sendingReply ||
                          !replyMessage.trim()
                        }
                        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Send reply"
                      >
                        {sendingReply ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Send className="h-5 w-5" />
                        )}
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span>
                        Press Enter to send ·
                        Shift + Enter for a
                        new line
                      </span>

                      <span>
                        {
                          replyMessage.length
                        }
                        /2000
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}