export type SupportTicketStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED";

export type SupportTicketPriority =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "URGENT";

export type SupportMessageSender =
  | "PLAYER"
  | "ADMIN"
  | "AI"
  | string;

export interface AdminSupportUser {
  id: string;
  username?: string | null;
  fullName?: string | null;
  phone?: string | null;
}

export interface AdminSupportMessage {
  id: string;
  ticketId: string;
  senderType: SupportMessageSender;
  message: string;
  createdAt: string;
}

export interface AdminSupportTicket {
  id: string;
  userId: string;
  subject: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  createdAt: string;
  updatedAt: string;
  user?: AdminSupportUser | null;
  messages?: AdminSupportMessage[];
}

export interface AdminSupportTicketListResponse {
  success: boolean;
  tickets: AdminSupportTicket[];
  total?: number;
  message?: string;
}

export interface AdminSupportTicketResponse {
  success: boolean;
  ticket?: AdminSupportTicket;
  message?: string;
}

export interface AdminSupportReplyResponse {
  success: boolean;
  ticketMessage?: AdminSupportMessage;
  message?: string;
}

export interface AdminSupportUpdateResponse {
  success: boolean;
  ticket?: {
    id: string;
    status?: SupportTicketStatus;
    priority?: SupportTicketPriority;
    updatedAt?: string;
  };
  message?: string;
}

async function apiRequest<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    credentials: "include",

    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },

    ...options,
  });

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      "Invalid server response.",
    );
  }

  if (!response.ok) {
    let message =
      "Request failed.";

    if (
      typeof data === "object" &&
      data !== null &&
      "message" in data
    ) {
      const possibleMessage = (
        data as {
          message?: unknown;
        }
      ).message;

      if (
        typeof possibleMessage ===
        "string"
      ) {
        message = possibleMessage;
      }
    }

    throw new Error(message);
  }

  return data as T;
}

export async function getAdminSupportTickets(
  params?: {
    status?: SupportTicketStatus;
    priority?: SupportTicketPriority;
    search?: string;
  },
): Promise<AdminSupportTicketListResponse> {
  const query =
    new URLSearchParams();

  if (params?.status) {
    query.set(
      "status",
      params.status,
    );
  }

  if (params?.priority) {
    query.set(
      "priority",
      params.priority,
    );
  }

  if (params?.search?.trim()) {
    query.set(
      "search",
      params.search.trim(),
    );
  }

  const queryString =
    query.toString();

  return apiRequest<AdminSupportTicketListResponse>(
    `/api/admin/support/tickets${
      queryString
        ? `?${queryString}`
        : ""
    }`,
  );
}

export async function getAdminSupportTicket(
  ticketId: string,
): Promise<AdminSupportTicketResponse> {
  return apiRequest<AdminSupportTicketResponse>(
    `/api/admin/support/ticket?ticketId=${encodeURIComponent(
      ticketId,
    )}`,
  );
}

export async function replyToSupportTicket(
  ticketId: string,
  message: string,
): Promise<AdminSupportReplyResponse> {
  return apiRequest<AdminSupportReplyResponse>(
    `/api/admin/support/ticket/reply?ticketId=${encodeURIComponent(
      ticketId,
    )}`,
    {
      method: "POST",
      body: JSON.stringify({
        message,
      }),
    },
  );
}

export async function updateSupportTicketStatus(
  ticketId: string,
  status: SupportTicketStatus,
): Promise<AdminSupportUpdateResponse> {
  return apiRequest<AdminSupportUpdateResponse>(
    `/api/admin/support/ticket/status?ticketId=${encodeURIComponent(
      ticketId,
    )}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        status,
      }),
    },
  );
}

export async function updateSupportTicketPriority(
  ticketId: string,
  priority: SupportTicketPriority,
): Promise<AdminSupportUpdateResponse> {
  return apiRequest<AdminSupportUpdateResponse>(
    `/api/admin/support/ticket/priority?ticketId=${encodeURIComponent(
      ticketId,
    )}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        priority,
      }),
    },
  );
}