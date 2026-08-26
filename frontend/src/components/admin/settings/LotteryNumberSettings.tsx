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
   COMPONENT
============================================================ */

export default function LotteryNumberSettings() {
  /* ==========================================================
     GLOBAL LOTTERY STATUS
  ========================================================== */

  const [enable2D, setEnable2D] = useState(DEFAULT_2D.enabled);

  const [enable3D, setEnable3D] = useState(DEFAULT_3D.enabled);

  /* ==========================================================
     LOTTERY SETTINGS
  ========================================================== */

  const [twoD, setTwoD] = useState<LotterySettings>(DEFAULT_2D);

  const [threeD, setThreeD] = useState<LotterySettings>(DEFAULT_3D);

  /* ==========================================================
     UI STATE
  ========================================================== */

  const [loading, setLoading] = useState(true);

  const [saving2D, setSaving2D] = useState(false);

  const [saving3D, setSaving3D] = useState(false);

  const [savingGlobal, setSavingGlobal] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  /* ==========================================================
     LOAD SETTINGS
  ========================================================== */

  const loadSettings = useCallback(async () => {
    setLoading(true);

    setError("");

    try {
      const response = await fetch("/api/admin/lottery-number-settings", {
        method: "GET",

        credentials: "include",

        headers: {
          Accept: "application/json",
        },
      });

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.toLowerCase().includes("application/json")) {
        const text = await response.text();

        console.error(
          "Lottery number settings API returned non-JSON:",
          text.slice(0, 1000),
        );

        throw new Error(
          `API returned ${response.status} ${response.statusText} instead of JSON.`,
        );
      }

      const result =
        (await response.json()) as ApiResponse<LotterySettingsResponse>;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to load lottery number settings.",
        );
      }

      const loaded2D = result.data?.twoD;

      const loaded3D = result.data?.threeD;

      /*
       * --------------------------------------------------------
       * 2D
       * --------------------------------------------------------
       */

      if (loaded2D) {
        setTwoD({
          ...DEFAULT_2D,
          ...loaded2D,
          lotteryType: "2D",
        });

        setEnable2D(loaded2D.enabled);
      } else {
        setTwoD(DEFAULT_2D);

        setEnable2D(DEFAULT_2D.enabled);
      }

      /*
       * --------------------------------------------------------
       * 3D
       * --------------------------------------------------------
       */

      if (loaded3D) {
        setThreeD({
          ...DEFAULT_3D,
          ...loaded3D,
          lotteryType: "3D",
        });

        setEnable3D(loaded3D.enabled);
      } else {
        setThreeD(DEFAULT_3D);

        setEnable3D(DEFAULT_3D.enabled);
      }
    } catch (loadError) {
      console.error("Load lottery number settings error:", loadError);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load lottery number settings.",
      );
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
     CLEAR MESSAGE
  ========================================================== */

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  /* ==========================================================
     SAVE SINGLE SETTING
  ========================================================== */

  const saveLotterySettings = async (
    settings: LotterySettings,
    type: LotteryType,
  ) => {
    clearMessages();

    /*
     * --------------------------------------------------------
     * CLIENT VALIDATION
     * --------------------------------------------------------
     */

    if (
      !Number.isInteger(settings.numberLength) ||
      settings.numberLength <= 0
    ) {
      setError(`${type} number length must be a positive integer.`);

      return;
    }

    if (!Number.isInteger(settings.minBet) || settings.minBet <= 0) {
      setError(`${type} minimum bet must be greater than 0.`);

      return;
    }

    if (!Number.isInteger(settings.maxBet) || settings.maxBet <= 0) {
      setError(`${type} maximum bet must be greater than 0.`);

      return;
    }

    if (settings.minBet > settings.maxBet) {
      setError(`${type} minimum bet cannot exceed maximum bet.`);

      return;
    }

    if (
      !Number.isInteger(settings.maxNumberLimit) ||
      settings.maxNumberLimit <= 0
    ) {
      setError(`${type} maximum number limit must be greater than 0.`);

      return;
    }

    if (type === "2D" && settings.numberLength !== 2) {
      setError("2D number length must be 2.");

      return;
    }

    if (type === "3D" && settings.numberLength !== 3) {
      setError("3D number length must be 3.");

      return;
    }

    /*
     * --------------------------------------------------------
     * SAVING INDICATOR
     * --------------------------------------------------------
     */

    if (type === "2D") {
      setSaving2D(true);
    } else {
      setSaving3D(true);
    }

    try {
      const response = await fetch("/api/admin/lottery-number-settings", {
        method: "PUT",

        credentials: "include",

        headers: {
          "Content-Type": "application/json",

          Accept: "application/json",
        },

        body: JSON.stringify({
          lotteryType: settings.lotteryType,

          enabled: settings.enabled,

          numberLength: settings.numberLength,

          minBet: settings.minBet,

          maxBet: settings.maxBet,

          maxNumberLimit: settings.maxNumberLimit,

          allowDuplicateNumbers: settings.allowDuplicateNumbers,
        }),
      });

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.toLowerCase().includes("application/json")) {
        const text = await response.text();

        console.error(
          "Save lottery number settings returned non-JSON:",
          text.slice(0, 1000),
        );

        throw new Error(
          `API returned ${response.status} ${response.statusText} instead of JSON.`,
        );
      }

      const result = (await response.json()) as ApiResponse<{
        setting?: LotterySettings;
      }>;

      if (!response.ok || !result.success) {
        throw new Error(result.message || `Failed to save ${type} settings.`);
      }

      /*
       * --------------------------------------------------------
       * Update local state using database response
       * --------------------------------------------------------
       */

      const savedSetting = result.data?.setting;

      if (savedSetting) {
        if (type === "2D") {
          setTwoD({
            ...savedSetting,
            lotteryType: "2D",
          });

          setEnable2D(savedSetting.enabled);
        } else {
          setThreeD({
            ...savedSetting,
            lotteryType: "3D",
          });

          setEnable3D(savedSetting.enabled);
        }
      }

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
    await saveLotterySettings(
      {
        ...twoD,
        enabled: enable2D,
      },
      "2D",
    );
  };

  /* ==========================================================
     SAVE 3D
  ========================================================== */

  const handleSave3D = async () => {
    await saveLotterySettings(
      {
        ...threeD,
        enabled: enable3D,
      },
      "3D",
    );
  };

  /* ==========================================================
     GLOBAL LOTTERY STATUS
     
     The enable/disable controls are also persisted.
     
     We save the corresponding existing 2D/3D records instead
     of introducing another table.
  ========================================================== */

  const handleGlobal2DChange = async (enabled: boolean) => {
    setEnable2D(enabled);

    setTwoD((prev) => ({
      ...prev,
      enabled,
    }));

    clearMessages();

    setSavingGlobal(true);

    try {
      const response = await fetch("/api/admin/lottery-number-settings", {
        method: "PUT",

        credentials: "include",

        headers: {
          "Content-Type": "application/json",

          Accept: "application/json",
        },

        body: JSON.stringify({
          lotteryType: "2D",

          enabled,

          numberLength: twoD.numberLength,

          minBet: twoD.minBet,

          maxBet: twoD.maxBet,

          maxNumberLimit: twoD.maxNumberLimit,

          allowDuplicateNumbers: twoD.allowDuplicateNumbers,
        }),
      });

      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to update 2D lottery status.",
        );
      }

      setSuccess(
        `2D lottery ${enabled ? "enabled" : "disabled"} successfully.`,
      );
    } catch (saveError) {
      console.error("Update 2D lottery status error:", saveError);

      /*
       * Revert UI when database update fails.
       */

      setEnable2D(twoD.enabled);

      setTwoD((prev) => ({
        ...prev,
        enabled: twoD.enabled,
      }));

      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to update 2D lottery status.",
      );
    } finally {
      setSavingGlobal(false);
    }
  };

  /* ==========================================================
     GLOBAL 3D STATUS
  ========================================================== */

  const handleGlobal3DChange = async (enabled: boolean) => {
    setEnable3D(enabled);

    setThreeD((prev) => ({
      ...prev,
      enabled,
    }));

    clearMessages();

    setSavingGlobal(true);

    try {
      const response = await fetch("/api/admin/lottery-number-settings", {
        method: "PUT",

        credentials: "include",

        headers: {
          "Content-Type": "application/json",

          Accept: "application/json",
        },

        body: JSON.stringify({
          lotteryType: "3D",

          enabled,

          numberLength: threeD.numberLength,

          minBet: threeD.minBet,

          maxBet: threeD.maxBet,

          maxNumberLimit: threeD.maxNumberLimit,

          allowDuplicateNumbers: threeD.allowDuplicateNumbers,
        }),
      });

      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to update 3D lottery status.",
        );
      }

      setSuccess(
        `3D lottery ${enabled ? "enabled" : "disabled"} successfully.`,
      );
    } catch (saveError) {
      console.error("Update 3D lottery status error:", saveError);

      setEnable3D(threeD.enabled);

      setThreeD((prev) => ({
        ...prev,
        enabled: threeD.enabled,
      }));

      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to update 3D lottery status.",
      );
    } finally {
      setSavingGlobal(false);
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
          GLOBAL MESSAGE
      ======================================================= */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

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
          {/* 2D */}

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <h3 className="font-semibold">2D Lottery</h3>

              <p className="text-sm text-gray-500">
                Enable or disable 2D lottery
              </p>
            </div>

            <input
              type="checkbox"
              checked={enable2D}
              disabled={savingGlobal}
              onChange={(event) =>
                void handleGlobal2DChange(event.target.checked)
              }
              className="h-5 w-5"
            />
          </div>

          {/* 3D */}

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <h3 className="font-semibold">3D Lottery</h3>

              <p className="text-sm text-gray-500">
                Enable or disable 3D lottery
              </p>
            </div>

            <input
              type="checkbox"
              checked={enable3D}
              disabled={savingGlobal}
              onChange={(event) =>
                void handleGlobal3DChange(event.target.checked)
              }
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
            disabled={saving2D}
            onChange={(event) =>
              setTwoD((prev) => ({
                ...prev,
                enabled: event.target.checked,
              }))
            }
            className="h-5 w-5"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Input
            label="Number Length"
            type="number"
            value={twoD.numberLength}
            min={1}
            onChange={(event) =>
              setTwoD((prev) => ({
                ...prev,
                numberLength: Number(event.target.value),
              }))
            }
          />

          <Input
            label="Minimum Bet (MMK)"
            type="number"
            value={twoD.minBet}
            min={1}
            onChange={(event) =>
              setTwoD((prev) => ({
                ...prev,
                minBet: Number(event.target.value),
              }))
            }
          />

          <Input
            label="Maximum Bet (MMK)"
            type="number"
            value={twoD.maxBet}
            min={1}
            onChange={(event) =>
              setTwoD((prev) => ({
                ...prev,
                maxBet: Number(event.target.value),
              }))
            }
          />

          <Input
            label="Maximum Number Limit"
            type="number"
            value={twoD.maxNumberLimit}
            min={1}
            onChange={(event) =>
              setTwoD((prev) => ({
                ...prev,
                maxNumberLimit: Number(event.target.value),
              }))
            }
          />
        </div>

        <label className="mt-5 flex items-center gap-2">
          <input
            type="checkbox"
            checked={twoD.allowDuplicateNumbers}
            disabled={saving2D}
            onChange={(event) =>
              setTwoD((prev) => ({
                ...prev,
                allowDuplicateNumbers: event.target.checked,
              }))
            }
            className="h-4 w-4"
          />

          <span className="text-sm">Allow Duplicate Numbers</span>
        </label>

        <div className="mt-5 flex justify-end">
          <Button
            variant="success"
            disabled={saving2D}
            onClick={() => void handleSave2D()}
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
            disabled={saving3D}
            onChange={(event) =>
              setThreeD((prev) => ({
                ...prev,
                enabled: event.target.checked,
              }))
            }
            className="h-5 w-5"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Input
            label="Number Length"
            type="number"
            value={threeD.numberLength}
            min={1}
            onChange={(event) =>
              setThreeD((prev) => ({
                ...prev,
                numberLength: Number(event.target.value),
              }))
            }
          />

          <Input
            label="Minimum Bet (MMK)"
            type="number"
            value={threeD.minBet}
            min={1}
            onChange={(event) =>
              setThreeD((prev) => ({
                ...prev,
                minBet: Number(event.target.value),
              }))
            }
          />

          <Input
            label="Maximum Bet (MMK)"
            type="number"
            value={threeD.maxBet}
            min={1}
            onChange={(event) =>
              setThreeD((prev) => ({
                ...prev,
                maxBet: Number(event.target.value),
              }))
            }
          />

          <Input
            label="Maximum Number Limit"
            type="number"
            value={threeD.maxNumberLimit}
            min={1}
            onChange={(event) =>
              setThreeD((prev) => ({
                ...prev,
                maxNumberLimit: Number(event.target.value),
              }))
            }
          />
        </div>

        <label className="mt-5 flex items-center gap-2">
          <input
            type="checkbox"
            checked={threeD.allowDuplicateNumbers}
            disabled={saving3D}
            onChange={(event) =>
              setThreeD((prev) => ({
                ...prev,
                allowDuplicateNumbers: event.target.checked,
              }))
            }
            className="h-4 w-4"
          />

          <span className="text-sm">Allow Duplicate Numbers</span>
        </label>

        <div className="mt-5 flex justify-end">
          <Button
            variant="success"
            disabled={saving3D}
            onClick={() => void handleSave3D()}
          >
            {saving3D ? "Saving..." : "Save 3D Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}
