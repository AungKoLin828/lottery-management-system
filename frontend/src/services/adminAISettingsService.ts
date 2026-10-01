/* ============================================================
   TYPES
============================================================ */

export interface AdminAISettings {
  key: string;

  databaseEnabled: boolean;

  environmentEnabled: boolean;

  enabled: boolean;

  description?: string | null;

  updatedAt?: string | null;
}

export interface AdminAISettingsResponse {
  success: boolean;

  setting?: AdminAISettings;

  message?: string;
}

/* ============================================================
   API HELPER
============================================================ */

async function apiRequest<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const response =
    await fetch(url, {
      credentials:
        "include",

      headers: {
        "Content-Type":
          "application/json",

        ...(options?.headers ??
          {}),
      },

      ...options,
    });

  let data: unknown;

  try {
    data =
      await response.json();
  } catch {
    throw new Error(
      "Invalid server response.",
    );
  }

  if (!response.ok) {
    let message =
      "Request failed.";

    if (
      typeof data ===
        "object" &&
      data !== null &&
      "message" in data
    ) {
      const possibleMessage =
        (
          data as {
            message?: unknown;
          }
        ).message;

      if (
        typeof possibleMessage ===
        "string"
      ) {
        message =
          possibleMessage;
      }
    }

    throw new Error(
      message,
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
  );
}

/* ============================================================
   UPDATE
============================================================ */

export async function updateAdminAISettings(
  enabled: boolean,
): Promise<AdminAISettingsResponse> {
  return apiRequest<AdminAISettingsResponse>(
    "/api/admin/ai-support/settings/update",
    {
      method: "PATCH",

      body: JSON.stringify({
        enabled,
      }),
    },
  );
}