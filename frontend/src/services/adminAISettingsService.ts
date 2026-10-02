/* ============================================================
   TYPES
============================================================ */

export interface AdminAISettings {
  enabled: boolean;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface AdminAISettingsResponse {
  success: boolean;
  settings?: AdminAISettings;
  message?: string;
}

export interface AdminAISettingsUpdateResponse {
  success: boolean;
  settings?: AdminAISettings;
  message?: string;
}

/* ============================================================
   API REQUEST
============================================================ */

async function apiRequest<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const response =
    await fetch(url, {
      credentials: "include",

      headers: {
        Accept:
          "application/json",

        "Content-Type":
          "application/json",

        ...(options?.headers ??
          {}),
      },

      ...options,
    });

  const contentType =
    response.headers.get(
      "content-type",
    ) ?? "";

  const text =
    await response.text();

  if (!text.trim()) {
    throw new Error(
      response.ok
        ? "The server returned an empty response."
        : `Request failed with status ${response.status}.`,
    );
  }

  if (
    !contentType
      .toLowerCase()
      .includes(
        "application/json",
      )
  ) {
    console.error(
      "Admin AI settings returned non-JSON:",
      text.slice(0, 1000),
    );

    throw new Error(
      "The server returned an invalid response.",
    );
  }

  let data: unknown;

  try {
    data =
      JSON.parse(text);
  } catch {
    throw new Error(
      "The server returned invalid JSON.",
    );
  }

  if (!response.ok) {
    if (
      typeof data ===
        "object" &&
      data !== null &&
      "message" in data
    ) {
      const message =
        (
          data as {
            message?: unknown;
          }
        ).message;

      if (
        typeof message ===
        "string"
      ) {
        throw new Error(
          message,
        );
      }
    }

    throw new Error(
      `Request failed with status ${response.status}.`,
    );
  }

  return data as T;
}

/* ============================================================
   GET
============================================================ */

export async function getAdminAISettings(): Promise<AdminAISettingsResponse> {
  return apiRequest<AdminAISettingsResponse>(
    "/api/admin/ai-support/settings",
    {
      method: "GET",
    },
  );
}

/* ============================================================
   UPDATE
============================================================ */

export async function updateAdminAISettings(
  enabled: boolean,
): Promise<AdminAISettingsUpdateResponse> {
  return apiRequest<AdminAISettingsUpdateResponse>(
    "/api/admin/ai-support/settings/update",
    {
      method: "PATCH",

      body: JSON.stringify({
        enabled,
      }),
    },
  );
}

/* ============================================================
   ENABLE
============================================================ */

export async function enableAdminAI(): Promise<AdminAISettings> {
  const response =
    await updateAdminAISettings(
      true,
    );

  if (
    !response.success ||
    !response.settings
  ) {
    throw new Error(
      response.message ??
        "Failed to enable AI support.",
    );
  }

  return response.settings;
}

/* ============================================================
   DISABLE
============================================================ */

export async function disableAdminAI(): Promise<AdminAISettings> {
  const response =
    await updateAdminAISettings(
      false,
    );

  if (
    !response.success ||
    !response.settings
  ) {
    throw new Error(
      response.message ??
        "Failed to disable AI support.",
    );
  }

  return response.settings;
}