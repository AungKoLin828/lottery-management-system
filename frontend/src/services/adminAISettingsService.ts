/*
 * ============================================================
 * ADMIN AI SUPPORT SETTINGS SERVICE
 * ============================================================
 */

export interface AdminAISettings {
  id: number;
  enabled: boolean;
  updatedAt: string;
  updatedBy?: string | null;
}

export interface AdminAISettingsResponse {
  success: boolean;
  settings?: AdminAISettings;
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
        typeof possibleMessage === "string"
      ) {
        message = possibleMessage;
      }
    }

    throw new Error(message);
  }

  return data as T;
}

/*
 * ============================================================
 * GET AI SETTINGS
 * ============================================================
 */

export async function getAdminAISettings(): Promise<AdminAISettingsResponse> {
  return apiRequest<AdminAISettingsResponse>(
    "/api/admin/ai-support/settings",
  );
}

/*
 * ============================================================
 * UPDATE AI SETTINGS
 * ============================================================
 */

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

/*
 * ============================================================
 * ENABLE AI
 * ============================================================
 */

export async function enableAdminAI(): Promise<AdminAISettingsResponse> {
  return updateAdminAISettings(true);
}

/*
 * ============================================================
 * DISABLE AI
 * ============================================================
 */

export async function disableAdminAI(): Promise<AdminAISettingsResponse> {
  return updateAdminAISettings(false);
}