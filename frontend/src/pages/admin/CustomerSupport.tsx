import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  User,
  X,
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

const STATUS_OPTIONS: SupportTicketStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
];

const PRIORITY_OPTIONS: SupportTicketPriority[] = [
  "LOW",
  "NORMAL",
  "HIGH",
  "URGENT",
];

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString();
}

function getInitials(name?: string | null): string {
  if (!name) {
    return "PL";
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function statusLabel(status: SupportTicketStatus): string {
  return status
    .replace("_", " ")
    .replace(/\b\w/g, (value) => value.toUpperCase());
}

function priorityLabel(priority: SupportTicketPriority): string {
  return priority.charAt(0) + priority.slice(1).toLowerCase();
}

function StatusBadge({ status }: { status: SupportTicketStatus }) {
  const classes: Record<SupportTicketStatus, string> = {
    OPEN: "bg-blue-50 text-blue-700 border-blue-200",
    IN_PROGRESS: "bg-amber-50 text-amber-700 border-amber-200",
    RESOLVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    CLOSED: "bg-slate-100 text-slate-600 border-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${classes[status]}`}
    >
      {statusLabel(status)}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: SupportTicketPriority }) {
  const classes: Record<SupportTicketPriority, string> = {
    LOW: "bg-slate-50 text-slate-600 border-slate-200",
    NORMAL: "bg-blue-50 text-blue-600 border-blue-200",
    HIGH: "bg-orange-50 text-orange-700 border-orange-200",
    URGENT: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${classes[priority]}`}
    >
      {priorityLabel(priority)}
    </span>
  );
}

function MessageBubble({ message }: { message: AdminSupportMessage }) {
  const sender = message.senderType.toUpperCase();

  const isAdmin = sender === "ADMIN";

  const isAI = sender === "AI";

  const isPlayer = sender === "PLAYER";

  return (
    <div className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] sm:max-w-[75%]`}>
        <div
          className={`mb-1 flex items-center gap-2 text-[11px] text-slate-500 ${
            isAdmin ? "justify-end" : "justify-start"
          }`}
        >
          {isAI ? (
            <>
              <Bot size={13} />
              <span>AI Assistant</span>
            </>
          ) : isAdmin ? (
            <>
              <span>Admin</span>
            </>
          ) : isPlayer ? (
            <>
              <User size={13} />
              <span>Player</span>
            </>
          ) : (
            <span>{message.senderType}</span>
          )}
        </div>

        <div
          className={[
            "rounded-2xl border px-4 py-3",
            "text-sm leading-6",
            "whitespace-pre-wrap break-words",
            isAdmin
              ? "rounded-br-md border-blue-200 bg-blue-600 text-white"
              : isAI
                ? "rounded-bl-md border-violet-200 bg-violet-50 text-violet-950"
                : "rounded-bl-md border-slate-200 bg-white text-slate-800",
          ].join(" ")}
        >
          {message.message}
        </div>

        <div
          className={`mt-1 text-[10px] text-slate-400 ${
            isAdmin ? "text-right" : "text-left"
          }`}
        >
          {formatDate(message.createdAt)}
        </div>
      </div>
    </div>
  );
}

export default function CustomerSupport() {
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);

  const [selectedTicket, setSelectedTicket] =
    useState<AdminSupportTicket | null>(null);

  const [loading, setLoading] = useState(true);

  const [detailLoading, setDetailLoading] = useState(false);

  const [replyLoading, setReplyLoading] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState<SupportTicketStatus | "">(
    "",
  );

  const [priorityFilter, setPriorityFilter] = useState<
    SupportTicketPriority | ""
  >("");

  const [reply, setReply] = useState("");

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getAdminSupportTickets({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        search,
      });

      if (!response.success) {
        throw new Error(response.message || "Unable to load tickets.");
      }

      setTickets(response.tickets ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load support tickets.",
      );
    } finally {
      setLoading(false);
    }
  }, [priorityFilter, search, statusFilter]);

  const loadTicket = useCallback(async (ticketId: string) => {
    try {
      setDetailLoading(true);
      setError("");

      const response = await getAdminSupportTicket(ticketId);

      if (!response.success || !response.ticket) {
        throw new Error(response.message || "Unable to load ticket.");
      }

      setSelectedTicket(response.ticket);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load ticket.");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  async function handleSelectTicket(ticket: AdminSupportTicket) {
    await loadTicket(ticket.id);
  }

  async function handleRefresh() {
    await loadTickets();

    if (selectedTicket) {
      await loadTicket(selectedTicket.id);
    }
  }

  async function handleReply() {
    const message = reply.trim();

    if (!message) {
      return;
    }

    if (!selectedTicket) {
      return;
    }

    if (selectedTicket.status === "CLOSED") {
      return;
    }

    try {
      setReplyLoading(true);
      setError("");

      const response = await replyToSupportTicket(selectedTicket.id, message);

      if (!response.success) {
        throw new Error(response.message || "Unable to send reply.");
      }

      setReply("");

      await loadTicket(selectedTicket.id);

      await loadTickets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send reply.");
    } finally {
      setReplyLoading(false);
    }
  }

  async function handleStatusChange(status: SupportTicketStatus) {
    if (!selectedTicket) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      const response = await updateSupportTicketStatus(
        selectedTicket.id,
        status,
      );

      if (!response.success) {
        throw new Error(response.message || "Unable to update status.");
      }

      await loadTicket(selectedTicket.id);

      await loadTickets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update status.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePriorityChange(priority: SupportTicketPriority) {
    if (!selectedTicket) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      const response = await updateSupportTicketPriority(
        selectedTicket.id,
        priority,
      );

      if (!response.success) {
        throw new Error(response.message || "Unable to update priority.");
      }

      await loadTicket(selectedTicket.id);

      await loadTickets();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update priority.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  const ticketCountText = useMemo(() => {
    return `${tickets.length} ${tickets.length === 1 ? "ticket" : "tickets"}`;
  }, [tickets.length]);

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto flex h-full max-w-[1600px] flex-col p-3 sm:p-5">
        {/* HEADER */}
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
                <MessageCircle size={18} />
              </div>

              <div>
                <h1 className="text-base font-semibold text-slate-900">
                  Customer Support
                </h1>

                <p className="text-xs text-slate-500">
                  Manage player and AI support conversations
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleRefresh()}
            disabled={loading || detailLoading}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <div className="flex-1">{error}</div>

            <button
              type="button"
              onClick={() => setError("")}
              className="shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* FILTERS */}
        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_180px_180px]">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search subject, username, name, phone..."
                className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as SupportTicketStatus | "")
              }
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All Status</option>

              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {statusLabel(status)}
                </option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(event) =>
                setPriorityFilter(
                  event.target.value as SupportTicketPriority | "",
                )
              }
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All Priority</option>

              {PRIORITY_OPTIONS.map((priority) => (
                <option key={priority} value={priority}>
                  {priorityLabel(priority)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* MAIN */}
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
          {/* TICKET LIST */}
          <div
            className={`min-h-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${
              selectedTicket ? "hidden lg:flex" : "flex"
            } flex-col`}
          >
            <div className="border-b border-slate-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800">
                  Tickets
                </span>

                <span className="text-xs text-slate-400">
                  {ticketCountText}
                </span>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {loading ? (
                <div className="space-y-2 p-3">
                  {Array.from({
                    length: 6,
                  }).map((_, index) => (
                    <div
                      key={index}
                      className="animate-pulse rounded-lg border border-slate-100 p-3"
                    >
                      <div className="mb-2 h-3 w-3/4 rounded bg-slate-100" />
                      <div className="mb-3 h-2 w-1/2 rounded bg-slate-100" />
                      <div className="h-2 w-1/3 rounded bg-slate-100" />
                    </div>
                  ))}
                </div>
              ) : tickets.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                  <MessageCircle size={30} className="mb-3 text-slate-300" />

                  <p className="text-sm font-medium text-slate-600">
                    No support tickets
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Tickets will appear here when players contact support.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {tickets.map((ticket) => {
                    const active = selectedTicket?.id === ticket.id;

                    return (
                      <button
                        type="button"
                        key={ticket.id}
                        onClick={() => void handleSelectTicket(ticket)}
                        className={`w-full px-4 py-3 text-left transition ${
                          active ? "bg-blue-50" : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="mb-1 flex items-start justify-between gap-2">
                          <span className="line-clamp-1 text-sm font-medium text-slate-800">
                            {ticket.subject}
                          </span>

                          <span className="shrink-0 text-[10px] text-slate-400">
                            {formatDate(ticket.updatedAt)}
                          </span>
                        </div>

                        <div className="mb-2 text-xs text-slate-500">
                          {ticket.user?.fullName ||
                            ticket.user?.username ||
                            ticket.user?.phone ||
                            "Unknown player"}
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          <StatusBadge status={ticket.status} />

                          <PriorityBadge priority={ticket.priority} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* DETAIL */}
          <div
            className={`min-h-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${
              selectedTicket ? "flex" : "hidden lg:flex"
            } flex-col`}
          >
            {!selectedTicket ? (
              <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                <MessageCircle size={42} className="mb-4 text-slate-300" />

                <h2 className="text-sm font-semibold text-slate-700">
                  Select a support ticket
                </h2>

                <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
                  Select a ticket from the list to view the conversation and
                  manage the support request.
                </p>
              </div>
            ) : detailLoading ? (
              <div className="flex h-full items-center justify-center">
                <RefreshCw size={24} className="animate-spin text-blue-500" />
              </div>
            ) : (
              <>
                {/* DETAIL HEADER */}
                <div className="border-b border-slate-200 bg-white px-4 py-3">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedTicket(null)}
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden"
                    >
                      <ArrowLeft size={16} />
                    </button>

                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                        {getInitials(
                          selectedTicket.user?.fullName ||
                            selectedTicket.user?.username,
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="truncate text-sm font-semibold text-slate-900">
                            {selectedTicket.subject}
                          </h2>

                          <StatusBadge status={selectedTicket.status} />

                          <PriorityBadge priority={selectedTicket.priority} />
                        </div>

                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span>
                            {selectedTicket.user?.fullName || "Unknown player"}
                          </span>

                          {selectedTicket.user?.username && (
                            <span>@{selectedTicket.user.username}</span>
                          )}

                          {selectedTicket.user?.phone && (
                            <span>{selectedTicket.user.phone}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div>
                      <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-slate-400">
                        Status
                      </label>

                      <select
                        value={selectedTicket.status}
                        disabled={actionLoading}
                        onChange={(event) =>
                          void handleStatusChange(
                            event.target.value as SupportTicketStatus,
                          )
                        }
                        className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-blue-400"
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {statusLabel(status)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-slate-400">
                        Priority
                      </label>

                      <select
                        value={selectedTicket.priority}
                        disabled={actionLoading}
                        onChange={(event) =>
                          void handlePriorityChange(
                            event.target.value as SupportTicketPriority,
                          )
                        }
                        className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-blue-400"
                      >
                        {PRIORITY_OPTIONS.map((priority) => (
                          <option key={priority} value={priority}>
                            {priorityLabel(priority)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2">
                      <div className="text-[10px] uppercase tracking-wide text-slate-400">
                        Created
                      </div>

                      <div className="mt-0.5 truncate text-xs font-medium text-slate-700">
                        {formatDate(selectedTicket.createdAt)}
                      </div>
                    </div>

                    <div className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2">
                      <div className="text-[10px] uppercase tracking-wide text-slate-400">
                        Updated
                      </div>

                      <div className="mt-0.5 truncate text-xs font-medium text-slate-700">
                        {formatDate(selectedTicket.updatedAt)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* CONVERSATION */}
                <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 px-4 py-5">
                  {selectedTicket.messages &&
                  selectedTicket.messages.length > 0 ? (
                    <div className="space-y-5">
                      {selectedTicket.messages.map((message) => (
                        <MessageBubble key={message.id} message={message} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-400">
                      No messages found.
                    </div>
                  )}
                </div>

                {/* REPLY */}
                {selectedTicket.status === "CLOSED" ? (
                  <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                      <CheckCircle2 size={15} />
                      This ticket is closed.
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-slate-200 bg-white p-3">
                    <div className="flex items-end gap-2">
                      <textarea
                        value={reply}
                        onChange={(event) => setReply(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault();

                            void handleReply();
                          }
                        }}
                        maxLength={5000}
                        rows={2}
                        placeholder="Write a reply to the player..."
                        className="min-h-[64px] flex-1 resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      />

                      <button
                        type="button"
                        onClick={() => void handleReply()}
                        disabled={replyLoading || !reply.trim()}
                        className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Send size={15} />

                        <span className="hidden sm:inline">
                          {replyLoading ? "Sending..." : "Send"}
                        </span>
                      </button>
                    </div>

                    <div className="mt-1 flex items-center justify-between px-1 text-[10px] text-slate-400">
                      <span>Enter to send · Shift+Enter for new line</span>

                      <span>{reply.length}/5000</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
