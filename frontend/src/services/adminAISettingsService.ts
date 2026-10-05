/*
 * ============================================================
 * ADMIN AI SUPPORT SETTINGS SERVICE
 * ============================================================
 *
 * Purpose:
 * - Get the current AI support ON/OFF setting.
 * - Update the AI support ON/OFF setting.
 *
 * IMPORTANT:
 * - Keeps the existing API response interfaces unchanged.
 * - Keeps the existing endpoint URLs unchanged.
 * - Keeps credentials: "include".
 * - Ensures the PATCH payload always contains a real boolean.
 * - Does not change any unrelated service behavior.
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

/*
 * ============================================================
 * API REQUEST HELPER
 * ============================================================
 */

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
 * BOOLEAN NORMALIZER
 * ============================================================
 *
 * The update API requires:
 *
 * {
 *   enabled: true
 * }
 *
 * or:
 *
 * {
 *   enabled: false
 * }
 *
 * This helper protects the API boundary from accidental
 * string values such as:
 *
 * "true"
 * "false"
 *
 * IMPORTANT:
 * Do NOT use Boolean("false"), because that produces true.
 * ============================================================
 */

function normalizeBoolean(
  value: boolean,
): boolean {
  if (typeof value !== "boolean") {
    throw new Error(
      "AI support enabled value must be a boolean.",
    );
  }

  return value;
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
  /*
   * Make absolutely sure the value sent to JSON.stringify()
   * is a real JavaScript boolean.
   */
  const normalizedEnabled =
    normalizeBoolean(enabled);

  return apiRequest<AdminAISettingsResponse>(
    "/api/admin/ai-support/settings/update",
    {
      method: "PATCH",

      body: JSON.stringify({
        enabled: normalizedEnabled,
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