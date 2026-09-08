import { supabase } from "@/lib/supabase";

interface RealtimeTokenResponse {
  success: boolean;

  message?: string;

  data?: {
    token: string;
  };
}

let realtimeToken: string | null = null;

let realtimeTokenExpiresAt = 0;

let refreshPromise: Promise<string | null> | null = null;

/* ============================================================
   CONSTANTS
============================================================ */

const TOKEN_REFRESH_BUFFER_MS = 60_000;

/* ============================================================
   FETCH TOKEN FROM SERVER
============================================================ */

async function fetchRealtimeToken(): Promise<string | null> {
  try {
    const response = await fetch("/api/realtime-token", {
      method: "GET",

      credentials: "include",

      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.warn("[Realtime Auth] Authentication required");
      } else {
        console.error("[Realtime Auth] Token request failed:", response.status);
      }

      return null;
    }

    const data = (await response.json()) as RealtimeTokenResponse;

    if (!data.success || !data.data?.token) {
      console.error("[Realtime Auth] Invalid token response");

      return null;
    }

    realtimeToken = data.data.token;

    /*
     * The server currently issues a 10-minute token.
     *
     * Keep a conservative local expiration time so that
     * we refresh before the JWT expires.
     */
    realtimeTokenExpiresAt = Date.now() + 9 * 60 * 1000;

    return realtimeToken;
  } catch (error) {
    console.error("[Realtime Auth] Token request error:", error);

    return null;
  }
}

/* ============================================================
   GET VALID REALTIME TOKEN
============================================================ */

export async function getRealtimeToken(): Promise<string | null> {
  const now = Date.now();

  if (realtimeToken && now < realtimeTokenExpiresAt - TOKEN_REFRESH_BUFFER_MS) {
    return realtimeToken;
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = fetchRealtimeToken();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

/* ============================================================
   AUTHENTICATE SUPABASE REALTIME
============================================================ */

export async function initializeRealtimeAuth(): Promise<boolean> {
  const token = await getRealtimeToken();

  if (!token) {
    return false;
  }

  supabase.realtime.setAuth(token);

  console.log("[Realtime Auth] Supabase Realtime authenticated");

  return true;
}

/* ============================================================
   REFRESH REALTIME AUTH
============================================================ */

export async function refreshRealtimeAuth(): Promise<boolean> {
  /*
   * Force a fresh token on the next request.
   */
  realtimeToken = null;

  realtimeTokenExpiresAt = 0;

  return initializeRealtimeAuth();
}

/* ============================================================
   CLEAR REALTIME AUTH
============================================================ */

export function clearRealtimeAuth(): void {
  realtimeToken = null;

  realtimeTokenExpiresAt = 0;

  refreshPromise = null;

  /*
   * Remove the current authorization token from
   * Supabase Realtime.
   */
  supabase.realtime.setAuth();

  console.log("[Realtime Auth] Cleared");
}
