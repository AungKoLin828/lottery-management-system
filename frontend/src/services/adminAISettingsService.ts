/* ============================================================
   TYPES
============================================================ */

export interface AdminAISettings {
  enabled: boolean;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface AdminAISettingsAdmin {
  id: string;
  username: string | null;
}

export interface AdminAISettingsResponse {
  success: boolean;

  settings?: AdminAISettings;

  admin?: AdminAISettingsAdmin;

  message?: string;
}

export interface UpdateAdminAISettingsResponse {
  success: boolean;

  settings?: AdminAISettings;

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

  const raw =
    await response.text();

  if (!raw.trim()) {
    throw new Error(
      `API returned ${response.status} ${response.statusText} with an empty response.`,
    );
  }

  if (
    !contentType
      .toLowerCase()
      .includes("application/json")
  ) {
    console.error(
      "Admin AI settings API returned non-JSON:",
      raw.slice(0, 1000),
    );

    throw new Error(
      `API returned ${response.status} ${response.statusText} instead of JSON.`,
    );
  }

  let data: unknown;

  try {
    data =
      JSON.parse(raw);
  } catch {
    throw new Error(
      "The server returned invalid JSON.",
    );
  }

  if (
    !response.ok
  ) {
    if (
      typeof data ===
        "object" &&
      data !== null &&
      "message" in data
    ) {
      const message =
        (data as {
          message?: unknown;
        }).message;

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
   GET AI SETTINGS
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
   UPDATE AI ENABLED STATE
============================================================ */

export async function updateAdminAISettings(
  enabled: boolean,
): Promise<UpdateAdminAISettingsResponse> {
  return apiRequest<UpdateAdminAISettingsResponse>(
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
   CONVENIENCE FUNCTION
============================================================ */

export async function setAdminAIEnabled(
  enabled: boolean,
): Promise<AdminAISettings> {
  const response =
    await updateAdminAISettings(
      enabled,
    );

  if (
    !response.success ||
    !response.settings
  ) {
    throw new Error(
      response.message ??
        "Failed to update AI support settings.",
    );
  }

  return response.settings;
}