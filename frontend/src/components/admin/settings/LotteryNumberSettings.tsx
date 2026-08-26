import { useCallback, useEffect, useState } from "react";

import Button from "@/components/common/Button";
import Input from "@/components/common/Input";

/* ============================================================
   TYPES
============================================================ */

type LotteryType = "2D" | "3D";

interface LotterySettings {
  id?: string;

  lotteryType: LotteryType;

  enabled: boolean;

  numberLength: number;

  minBet: number;

  maxBet: number;

  maxNumberLimit: number;

  allowDuplicateNumbers: boolean;

  createdAt?: string;

  updatedAt?: string;
}

interface ApiResponse<T = unknown> {
  success: boolean;

  message?: string;

  data?: T;
}

interface LotterySettingsResponse {
  settings?: LotterySettings[];

  twoD?: LotterySettings | null;

  threeD?: LotterySettings | null;
}

interface SaveSettingsResponse {
  setting?: LotterySettings;
}

/* ============================================================
   DEFAULT VALUES
============================================================ */

const DEFAULT_2D: LotterySettings = {
  lotteryType: "2D",

  enabled: true,

  numberLength: 2,

  minBet: 100,

  maxBet: 100000,

  maxNumberLimit: 10,

  allowDuplicateNumbers: false,
};

const DEFAULT_3D: LotterySettings = {
  lotteryType: "3D",

  enabled: true,

  numberLength: 3,

  minBet: 100,

  maxBet: 100000,

  maxNumberLimit: 10,

  allowDuplicateNumbers: false,
};

/* ============================================================
   API ENDPOINTS
============================================================ */

/*
 * Primary endpoint.
 *
 * This should normally be:
 *
 * /api/admin/lottery-number-settings
 *
 * The fallback endpoints make the frontend work even when
 * the corresponding Netlify redirect has not been configured.
 */
const API_ENDPOINTS = [
  "/api/admin/lottery-number-settings",

  "/.netlify/functions/lottery-number-settings",

  "/.netlify/functions/admin-lottery-number-settings",
] as const;

/* ============================================================
   API ERROR
============================================================ */

class ApiError extends Error {
  status: number;

  statusText: string;

  responseBody: string;

  constructor(
    message: string,
    status: number,
    statusText: string,
    responseBody: string,
  ) {
    super(message);

    this.name = "ApiError";

    this.status = status;

    this.statusText = statusText;

    this.responseBody = responseBody;
  }
}

/* ============================================================
   READ API RESPONSE
============================================================ */

/**
 * Safely reads an API response.
 *
 * The server may return:
 *
 * - JSON
 * - HTML 404 page
 * - HTML redirect page
 * - plain text
 *
 * Therefore we must NOT blindly call response.json().
 */
async function readApiResponse<T>(response: Response): Promise<{
  result: ApiResponse<T> | null;

  rawText: string;
}> {
  const rawText = await response.text();

  const contentType = response.headers.get("content-type") || "";

  /*
   * ----------------------------------------------------------
   * JSON RESPONSE
   * ----------------------------------------------------------
   */

  if (contentType.toLowerCase().includes("application/json")) {
    try {
      const result = JSON.parse(rawText) as ApiResponse<T>;

      return {
        result,

        rawText,
      };
    } catch {
      throw new ApiError(
        "The API returned invalid JSON.",
        response.status,
        response.statusText,
        rawText.slice(0, 1000),
      );
    }
  }

  /*
   * ----------------------------------------------------------
   * SOMETIMES SERVER DOES NOT SET CONTENT-TYPE CORRECTLY
   *
   * Try JSON parsing anyway.
   * ----------------------------------------------------------
   */

  if (rawText.trim()) {
    try {
      const result = JSON.parse(rawText) as ApiResponse<T>;

      return {
        result,

        rawText,
      };
    } catch {
      // Not JSON. Continue below.
    }
  }

  /*
   * ----------------------------------------------------------
   * NON-JSON RESPONSE
   * ----------------------------------------------------------
   */

  throw new ApiError(
    `API returned ${response.status} ${response.statusText} instead of JSON.`,
    response.status,
    response.statusText,
    rawText.slice(0, 1000),
  );
}

/* ============================================================
   API REQUEST
============================================================ */

/**
 * Sends an authenticated API request.
 *
 * The primary /api route is tried first.
 *
 * If the server returns a non-JSON 404/405 response,
 * fallback Netlify Function URLs are tried.
 */
async function apiRequest<T>(
  method: "GET" | "PUT",
  body?: unknown,
): Promise<ApiResponse<T>> {
  let lastError: unknown = null;

  for (let index = 0; index < API_ENDPOINTS.length; index += 1) {
    const endpoint = API_ENDPOINTS[index];

    try {
      const response = await fetch(endpoint, {
        method,

        credentials: "include",

        headers: {
          Accept: "application/json",

          ...(body !== undefined
            ? {
                "Content-Type": "application/json",
              }
            : {}),
        },

        ...(body !== undefined
          ? {
              body: JSON.stringify(body),
            }
          : {}),
      });

      /*
       * ------------------------------------------------------
       * READ RESPONSE
       * ------------------------------------------------------
       */

      const { result } = await readApiResponse<T>(response);

      /*
       * ------------------------------------------------------
       * SERVER RETURNED JSON
       * ------------------------------------------------------
       */

      if (!result) {
        throw new ApiError(
          "API returned an empty response.",
          response.status,
          response.statusText,
          "",
        );
      }

      /*
       * If this is a real API response, return it.
       */
      return result;
    } catch (requestError) {
      lastError = requestError;

      /*
       * ------------------------------------------------------
       * FALLBACK ONLY FOR ROUTING ERRORS
       * ------------------------------------------------------
       *
       * Do not hide authentication errors or database errors.
       *
       * For example:
       *
       * 401 JSON -> return it
       * 400 JSON -> return it
       * 500 JSON -> return it
       *
       * Only continue to another endpoint when the response
       * was a non-JSON routing-style error.
       */

      if (requestError instanceof ApiError) {
        const isRoutingError =
          requestError.status === 404 ||
          requestError.status === 405 ||
          requestError.status === 301 ||
          requestError.status === 302 ||
          requestError.status === 307 ||
          requestError.status === 308;

        if (!isRoutingError) {
          throw requestError;
        }

        console.warn(
          `API endpoint unavailable: ${endpoint}`,
          requestError.responseBody,
        );

        /*
         * Try next endpoint.
         */
        continue;
      }

      /*
       * Network error.
       *
       * Try fallback endpoint.
       */
      console.warn(`API request failed for ${endpoint}:`, requestError);
    }
  }

  /*
   * ----------------------------------------------------------
   * ALL ENDPOINTS FAILED
   * ----------------------------------------------------------
   */

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error("Unable to connect to lottery number settings API.");
}

/* ============================================================
   COMPONENT
============================================================ */

export default function LotteryNumberSettings() {
  /* ==========================================================
     SETTINGS
  ========================================================== */

  const [twoD, setTwoD] = useState<LotterySettings>(DEFAULT_2D);

  const [threeD, setThreeD] = useState<LotterySettings>(DEFAULT_3D);

  /* ==========================================================
     UI STATE
  ========================================================== */

  const [loading, setLoading] = useState(true);

  const [saving2D, setSaving2D] = useState(false);

  const [saving3D, setSaving3D] = useState(false);

  const [savingGlobal2D, setSavingGlobal2D] = useState(false);

  const [savingGlobal3D, setSavingGlobal3D] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  /* ==========================================================
     CLEAR MESSAGES
  ========================================================== */

  const clearMessages = useCallback(() => {
    setError("");

    setSuccess("");
  }, []);

  /* ==========================================================
     LOAD SETTINGS
  ========================================================== */

  const loadSettings = useCallback(async () => {
    setLoading(true);

    setError("");

    try {
      const result = await apiRequest<LotterySettingsResponse>("GET");

      /*
       * ------------------------------------------------------
       * CHECK API SUCCESS
       * ------------------------------------------------------
       */

      if (!result.success) {
        throw new Error(
          result.message || "Failed to load lottery number settings.",
        );
      }

      /*
       * ------------------------------------------------------
       * LOAD 2D
       * ------------------------------------------------------
       */

      const loaded2D = result.data?.twoD;

      if (loaded2D) {
        setTwoD({
          ...DEFAULT_2D,

          ...loaded2D,

          lotteryType: "2D",
        });
      } else {
        setTwoD({
          ...DEFAULT_2D,
        });
      }

      /*
       * ------------------------------------------------------
       * LOAD 3D
       * ------------------------------------------------------
       */

      const loaded3D = result.data?.threeD;

      if (loaded3D) {
        setThreeD({
          ...DEFAULT_3D,

          ...loaded3D,

          lotteryType: "3D",
        });
      } else {
        setThreeD({
          ...DEFAULT_3D,
        });
      }
    } catch (loadError) {
      console.error("Load lottery number settings error:", loadError);

      if (loadError instanceof ApiError) {
        /*
         * Show useful routing information.
         */

        if (loadError.status === 404 || loadError.status === 405) {
          setError(
            `Lottery settings API route was not found (${loadError.status}). Check your Netlify function/redirect configuration.`,
          );
        } else {
          setError(loadError.message);
        }
      } else {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load lottery number settings.",
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  /* ==========================================================
     VALIDATE SETTINGS
  ========================================================== */

  const validateSettings = (
    settings: LotterySettings,
    type: LotteryType,
  ): string | null => {
    /*
     * --------------------------------------------------------
     * NUMBER LENGTH
     * --------------------------------------------------------
     */

    if (
      !Number.isInteger(settings.numberLength) ||
      settings.numberLength <= 0
    ) {
      return `${type} number length must be a positive integer.`;
    }

    /*
     * --------------------------------------------------------
     * 2D
     * --------------------------------------------------------
     */

    if (type === "2D" && settings.numberLength !== 2) {
      return "2D number length must be 2.";
    }

    /*
     * --------------------------------------------------------
     * 3D
     * --------------------------------------------------------
     */

    if (type === "3D" && settings.numberLength !== 3) {
      return "3D number length must be 3.";
    }

    /*
     * --------------------------------------------------------
     * MINIMUM BET
     * --------------------------------------------------------
     */

    if (!Number.isInteger(settings.minBet) || settings.minBet <= 0) {
      return `${type} minimum bet must be greater than 0.`;
    }

    /*
     * --------------------------------------------------------
     * MAXIMUM BET
     * --------------------------------------------------------
     */

    if (!Number.isInteger(settings.maxBet) || settings.maxBet <= 0) {
      return `${type} maximum bet must be greater than 0.`;
    }

    /*
     * --------------------------------------------------------
     * BET RANGE
     * --------------------------------------------------------
     */

    if (settings.minBet > settings.maxBet) {
      return `${type} minimum bet cannot exceed maximum bet.`;
    }

    /*
     * --------------------------------------------------------
     * MAX NUMBER LIMIT
     * --------------------------------------------------------
     */

    if (
      !Number.isInteger(settings.maxNumberLimit) ||
      settings.maxNumberLimit <= 0
    ) {
      return `${type} maximum number limit must be greater than 0.`;
    }

    /*
     * --------------------------------------------------------
     * MAXIMUM POSSIBLE NUMBER
     * --------------------------------------------------------
     */

    const maximumPossibleNumbers = Math.pow(10, settings.numberLength);

    if (settings.maxNumberLimit > maximumPossibleNumbers) {
      return `${type} maximum number limit cannot exceed ${maximumPossibleNumbers}.`;
    }

    return null;
  };

  /* ==========================================================
     SAVE SETTINGS
  ========================================================== */

  const saveLotterySettings = async (
    settings: LotterySettings,
    type: LotteryType,
  ) => {
    clearMessages();

    /*
     * ------------------------------------------------------
     * VALIDATION
     * ------------------------------------------------------
     */

    const validationError = validateSettings(settings, type);

    if (validationError) {
      setError(validationError);

      return;
    }

    /*
     * ------------------------------------------------------
     * SAVE INDICATOR
     * ------------------------------------------------------
     */

    if (type === "2D") {
      setSaving2D(true);
    } else {
      setSaving3D(true);
    }

    try {
      const result = await apiRequest<SaveSettingsResponse>(
        "PUT",

        {
          lotteryType: type,

          enabled: settings.enabled,

          numberLength: settings.numberLength,

          minBet: settings.minBet,

          maxBet: settings.maxBet,

          maxNumberLimit: settings.maxNumberLimit,

          allowDuplicateNumbers: settings.allowDuplicateNumbers,
        },
      );

      /*
       * ------------------------------------------------------
       * API SUCCESS CHECK
       * ------------------------------------------------------
       */

      if (!result.success) {
        throw new Error(result.message || `Failed to save ${type} settings.`);
      }

      /*
       * ------------------------------------------------------
       * DATABASE RESPONSE
       * ------------------------------------------------------
       */

      const savedSetting = result.data?.setting;

      if (savedSetting) {
        if (type === "2D") {
          setTwoD({
            ...DEFAULT_2D,

            ...savedSetting,

            lotteryType: "2D",
          });
        } else {
          setThreeD({
            ...DEFAULT_3D,

            ...savedSetting,

            lotteryType: "3D",
          });
        }
      }

      /*
       * ------------------------------------------------------
       * SUCCESS
       * ------------------------------------------------------
       */

      setSuccess(`${type} settings saved successfully.`);
    } catch (saveError) {
      console.error(`Save ${type} settings error:`, saveError);

      setError(
        saveError instanceof Error
          ? saveError.message
          : `Failed to save ${type} settings.`,
      );
    } finally {
      if (type === "2D") {
        setSaving2D(false);
      } else {
        setSaving3D(false);
      }
    }
  };

  /* ==========================================================
     SAVE 2D
  ========================================================== */

  const handleSave2D = async () => {
    await saveLotterySettings(twoD, "2D");
  };

  /* ==========================================================
     SAVE 3D
  ========================================================== */

  const handleSave3D = async () => {
    await saveLotterySettings(threeD, "3D");
  };

  /* ==========================================================
     TOGGLE 2D
  ========================================================== */

  const handleGlobal2DChange = async (enabled: boolean) => {
    if (savingGlobal2D) {
      return;
    }

    clearMessages();

    /*
     * Save the OLD value in case we need to revert.
     */

    const previous = twoD.enabled;

    /*
     * Optimistic UI update.
     */

    setTwoD((current) => ({
      ...current,

      enabled,
    }));

    setSavingGlobal2D(true);

    try {
      const result = await apiRequest<SaveSettingsResponse>(
        "PUT",

        {
          lotteryType: "2D",

          enabled,

          numberLength: twoD.numberLength,

          minBet: twoD.minBet,

          maxBet: twoD.maxBet,

          maxNumberLimit: twoD.maxNumberLimit,

          allowDuplicateNumbers: twoD.allowDuplicateNumbers,
        },
      );

      if (!result.success) {
        throw new Error(
          result.message || "Failed to update 2D lottery status.",
        );
      }

      /*
       * Use actual database response.
       */

      const savedSetting = result.data?.setting;

      if (savedSetting) {
        setTwoD({
          ...DEFAULT_2D,

          ...savedSetting,

          lotteryType: "2D",
        });
      }

      setSuccess(
        `2D lottery ${enabled ? "enabled" : "disabled"} successfully.`,
      );
    } catch (toggleError) {
      console.error("Update 2D lottery status error:", toggleError);

      /*
       * Revert UI.
       */

      setTwoD((current) => ({
        ...current,

        enabled: previous,
      }));

      setError(
        toggleError instanceof Error
          ? toggleError.message
          : "Failed to update 2D lottery status.",
      );
    } finally {
      setSavingGlobal2D(false);
    }
  };

  /* ==========================================================
     TOGGLE 3D
  ========================================================== */

  const handleGlobal3DChange = async (enabled: boolean) => {
    if (savingGlobal3D) {
      return;
    }

    clearMessages();

    /*
     * Save old value for rollback.
     */

    const previous = threeD.enabled;

    /*
     * Optimistic UI update.
     */

    setThreeD((current) => ({
      ...current,

      enabled,
    }));

    setSavingGlobal3D(true);

    try {
      const result = await apiRequest<SaveSettingsResponse>(
        "PUT",

        {
          lotteryType: "3D",

          enabled,

          numberLength: threeD.numberLength,

          minBet: threeD.minBet,

          maxBet: threeD.maxBet,

          maxNumberLimit: threeD.maxNumberLimit,

          allowDuplicateNumbers: threeD.allowDuplicateNumbers,
        },
      );

      if (!result.success) {
        throw new Error(
          result.message || "Failed to update 3D lottery status.",
        );
      }

      /*
       * Use actual database response.
       */

      const savedSetting = result.data?.setting;

      if (savedSetting) {
        setThreeD({
          ...DEFAULT_3D,

          ...savedSetting,

          lotteryType: "3D",
        });
      }

      setSuccess(
        `3D lottery ${enabled ? "enabled" : "disabled"} successfully.`,
      );
    } catch (toggleError) {
      console.error("Update 3D lottery status error:", toggleError);

      /*
       * Revert UI.
       */

      setThreeD((current) => ({
        ...current,

        enabled: previous,
      }));

      setError(
        toggleError instanceof Error
          ? toggleError.message
          : "Failed to update 3D lottery status.",
      );
    } finally {
      setSavingGlobal3D(false);
    }
  };

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl bg-white p-8 text-center shadow">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600" />

          <p className="mt-4 text-sm text-gray-500">
            Loading lottery number settings...
          </p>
        </div>
      </div>
    );
  }

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="space-y-6">
      {/* ======================================================
          ERROR
      ======================================================= */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ======================================================
          SUCCESS
      ======================================================= */}

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* ======================================================
          LOTTERY TYPES
      ======================================================= */}

      <div className="rounded-xl bg-white p-5 shadow">
        <h2 className="mb-4 text-xl font-bold">Lottery Types</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* ==================================================
              2D
          =================================================== */}

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <h3 className="font-semibold">2D Lottery</h3>

              <p className="text-sm text-gray-500">
                Enable or disable 2D lottery
              </p>
            </div>

            <input
              type="checkbox"
              checked={twoD.enabled}
              disabled={savingGlobal2D || saving2D}
              onChange={(event) => {
                void handleGlobal2DChange(event.target.checked);
              }}
              className="h-5 w-5"
            />
          </div>

          {/* ==================================================
              3D
          =================================================== */}

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <h3 className="font-semibold">3D Lottery</h3>

              <p className="text-sm text-gray-500">
                Enable or disable 3D lottery
              </p>
            </div>

            <input
              type="checkbox"
              checked={threeD.enabled}
              disabled={savingGlobal3D || saving3D}
              onChange={(event) => {
                void handleGlobal3DChange(event.target.checked);
              }}
              className="h-5 w-5"
            />
          </div>
        </div>
      </div>

      {/* ======================================================
          2D SETTINGS
      ======================================================= */}

      <div className="rounded-xl bg-white p-5 shadow">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">2D Settings</h2>

            <p className="text-sm text-gray-500">
              Configure 2D lottery betting rules.
            </p>
          </div>

          <input
            type="checkbox"
            checked={twoD.enabled}
            disabled={saving2D || savingGlobal2D}
            onChange={(event) =>
              setTwoD((current) => ({
                ...current,

                enabled: event.target.checked,
              }))
            }
            className="h-5 w-5"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Number Length */}

          <Input
            label="Number Length"
            type="number"
            value={twoD.numberLength}
            min={1}
            onChange={(event) =>
              setTwoD((current) => ({
                ...current,

                numberLength: Number(event.target.value),
              }))
            }
          />

          {/* Minimum Bet */}

          <Input
            label="Minimum Bet (MMK)"
            type="number"
            value={twoD.minBet}
            min={1}
            onChange={(event) =>
              setTwoD((current) => ({
                ...current,

                minBet: Number(event.target.value),
              }))
            }
          />

          {/* Maximum Bet */}

          <Input
            label="Maximum Bet (MMK)"
            type="number"
            value={twoD.maxBet}
            min={1}
            onChange={(event) =>
              setTwoD((current) => ({
                ...current,

                maxBet: Number(event.target.value),
              }))
            }
          />

          {/* Maximum Number Limit */}

          <Input
            label="Maximum Number Limit"
            type="number"
            value={twoD.maxNumberLimit}
            min={1}
            onChange={(event) =>
              setTwoD((current) => ({
                ...current,

                maxNumberLimit: Number(event.target.value),
              }))
            }
          />
        </div>

        {/* Duplicate Numbers */}

        <label className="mt-5 flex items-center gap-2">
          <input
            type="checkbox"
            checked={twoD.allowDuplicateNumbers}
            disabled={saving2D}
            onChange={(event) =>
              setTwoD((current) => ({
                ...current,

                allowDuplicateNumbers: event.target.checked,
              }))
            }
            className="h-4 w-4"
          />

          <span className="text-sm">Allow Duplicate Numbers</span>
        </label>

        {/* Save */}

        <div className="mt-5 flex justify-end">
          <Button
            variant="success"
            disabled={saving2D || savingGlobal2D}
            onClick={() => {
              void handleSave2D();
            }}
          >
            {saving2D ? "Saving..." : "Save 2D Settings"}
          </Button>
        </div>
      </div>

      {/* ======================================================
          3D SETTINGS
      ======================================================= */}

      <div className="rounded-xl bg-white p-5 shadow">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">3D Settings</h2>

            <p className="text-sm text-gray-500">
              Configure 3D lottery betting rules.
            </p>
          </div>

          <input
            type="checkbox"
            checked={threeD.enabled}
            disabled={saving3D || savingGlobal3D}
            onChange={(event) =>
              setThreeD((current) => ({
                ...current,

                enabled: event.target.checked,
              }))
            }
            className="h-5 w-5"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Number Length */}

          <Input
            label="Number Length"
            type="number"
            value={threeD.numberLength}
            min={1}
            onChange={(event) =>
              setThreeD((current) => ({
                ...current,

                numberLength: Number(event.target.value),
              }))
            }
          />

          {/* Minimum Bet */}

          <Input
            label="Minimum Bet (MMK)"
            type="number"
            value={threeD.minBet}
            min={1}
            onChange={(event) =>
              setThreeD((current) => ({
                ...current,

                minBet: Number(event.target.value),
              }))
            }
          />

          {/* Maximum Bet */}

          <Input
            label="Maximum Bet (MMK)"
            type="number"
            value={threeD.maxBet}
            min={1}
            onChange={(event) =>
              setThreeD((current) => ({
                ...current,

                maxBet: Number(event.target.value),
              }))
            }
          />

          {/* Maximum Number Limit */}

          <Input
            label="Maximum Number Limit"
            type="number"
            value={threeD.maxNumberLimit}
            min={1}
            onChange={(event) =>
              setThreeD((current) => ({
                ...current,

                maxNumberLimit: Number(event.target.value),
              }))
            }
          />
        </div>

        {/* Duplicate Numbers */}

        <label className="mt-5 flex items-center gap-2">
          <input
            type="checkbox"
            checked={threeD.allowDuplicateNumbers}
            disabled={saving3D}
            onChange={(event) =>
              setThreeD((current) => ({
                ...current,

                allowDuplicateNumbers: event.target.checked,
              }))
            }
            className="h-4 w-4"
          />

          <span className="text-sm">Allow Duplicate Numbers</span>
        </label>

        {/* Save */}

        <div className="mt-5 flex justify-end">
          <Button
            variant="success"
            disabled={saving3D || savingGlobal3D}
            onClick={() => {
              void handleSave3D();
            }}
          >
            {saving3D ? "Saving..." : "Save 3D Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}
