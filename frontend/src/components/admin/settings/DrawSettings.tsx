import { useCallback, useEffect, useState } from "react";

import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Select from "@/components/common/Select";

/* ============================================================
   TYPES
============================================================ */

type DrawStatus = "Open" | "Closed" | "Suspended";

interface DrawSettingsData {
  id: string;

  enable2DDraw: boolean;

  enable3DDraw: boolean;

  twoDDrawTime: string;

  threeDDrawTime: string;

  ticketClosingTime2D: string;

  ticketClosingTime3D: string;

  manualResultEntry: boolean;

  resultPublishing: boolean;

  drawStatus: DrawStatus;

  createdAt?: string;

  updatedAt?: string;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

interface DrawSettingsResponse {
  settings: DrawSettingsData;
}

/* ============================================================
   API
============================================================ */

const DRAW_SETTINGS_API = "/api/admin/draw-settings";

/* ============================================================
   DEFAULT SETTINGS
============================================================ */

const DEFAULT_SETTINGS: Omit<DrawSettingsData, "id"> = {
  enable2DDraw: true,

  enable3DDraw: true,

  twoDDrawTime: "16:30",

  threeDDrawTime: "16:30",

  ticketClosingTime2D: "16:00",

  ticketClosingTime3D: "16:00",

  manualResultEntry: true,

  resultPublishing: true,

  drawStatus: "Open",
};

/* ============================================================
   COMPONENT
============================================================ */

export default function DrawSettings() {
  /* ==========================================================
     STATE
  ========================================================== */

  const [settings, setSettings] = useState<DrawSettingsData>({
    id: "",

    ...DEFAULT_SETTINGS,
  });

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  /* ==========================================================
     READ API RESPONSE
  ========================================================== */

  const readApiResponse = async <T,>(
    response: Response,
  ): Promise<ApiResponse<T>> => {
    const contentType = response.headers.get("content-type") || "";

    const rawResponse = await response.text();

    if (!rawResponse.trim()) {
      throw new Error(
        `API returned ${response.status} with an empty response.`,
      );
    }

    /*
     * Netlify returns HTML when a function/redirect
     * is missing. Detect this clearly.
     */

    if (!contentType.toLowerCase().includes("application/json")) {
      console.error("Draw settings API returned non-JSON:", {
        status: response.status,
        contentType,
        response: rawResponse.slice(0, 2000),
      });

      throw new Error(
        `Draw settings API returned ${response.status}. ` +
          `Please check the Netlify function and redirect configuration.`,
      );
    }

    try {
      return JSON.parse(rawResponse) as ApiResponse<T>;
    } catch (parseError) {
      console.error("Draw settings JSON parse error:", parseError);

      throw new Error("The server returned invalid JSON.");
    }
  };

  /* ==========================================================
     LOAD SETTINGS
  ========================================================== */

  const loadSettings = useCallback(async () => {
    setLoading(true);

    setError("");

    setSuccess("");

    try {
      const response = await fetch(DRAW_SETTINGS_API, {
        method: "GET",

        credentials: "include",

        headers: {
          Accept: "application/json",
        },
      });

      const result = await readApiResponse<DrawSettingsResponse>(response);

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load draw settings.");
      }

      const loadedSettings = result.data?.settings;

      if (!loadedSettings) {
        throw new Error("Draw settings were not returned by the server.");
      }

      setSettings({
        ...DEFAULT_SETTINGS,

        ...loadedSettings,
      });
    } catch (requestError) {
      console.error("Load draw settings error:", requestError);

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to load draw settings.",
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
     UPDATE SETTING
  ========================================================== */

  const updateSetting = <K extends keyof DrawSettingsData>(
    key: K,
    value: DrawSettingsData[K],
  ) => {
    setSettings((previous) => ({
      ...previous,

      [key]: value,
    }));

    setError("");

    setSuccess("");
  };

  /* ==========================================================
     VALIDATE TIME
  ========================================================== */

  const isValidTime = (value: string): boolean => {
    if (!/^\d{2}:\d{2}$/.test(value)) {
      return false;
    }

    const [hours, minutes] = value.split(":").map(Number);

    return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
  };

  /* ==========================================================
     SAVE SETTINGS
  ========================================================== */

  const handleSave = async () => {
    setError("");

    setSuccess("");

    /* --------------------------------------------------------
       TIME VALIDATION
    -------------------------------------------------------- */

    const timeFields = [
      {
        label: "2D draw time",
        value: settings.twoDDrawTime,
      },
      {
        label: "3D draw time",
        value: settings.threeDDrawTime,
      },
      {
        label: "2D ticket closing time",
        value: settings.ticketClosingTime2D,
      },
      {
        label: "3D ticket closing time",
        value: settings.ticketClosingTime3D,
      },
    ];

    for (const field of timeFields) {
      if (!isValidTime(field.value)) {
        setError(`${field.label} must use a valid HH:MM time.`);

        return;
      }
    }

    /* --------------------------------------------------------
       TICKET CLOSING VALIDATION
    -------------------------------------------------------- */

    /*
     * Ticket closing time should not be later than
     * the draw time.
     */

    if (settings.ticketClosingTime2D > settings.twoDDrawTime) {
      setError("2D ticket closing time cannot be later than the 2D draw time.");

      return;
    }

    if (settings.ticketClosingTime3D > settings.threeDDrawTime) {
      setError("3D ticket closing time cannot be later than the 3D draw time.");

      return;
    }

    setSaving(true);

    try {
      const response = await fetch(DRAW_SETTINGS_API, {
        method: "PUT",

        credentials: "include",

        headers: {
          "Content-Type": "application/json",

          Accept: "application/json",
        },

        body: JSON.stringify({
          enable2DDraw: settings.enable2DDraw,

          enable3DDraw: settings.enable3DDraw,

          twoDDrawTime: settings.twoDDrawTime,

          threeDDrawTime: settings.threeDDrawTime,

          ticketClosingTime2D: settings.ticketClosingTime2D,

          ticketClosingTime3D: settings.ticketClosingTime3D,

          manualResultEntry: settings.manualResultEntry,

          resultPublishing: settings.resultPublishing,

          drawStatus: settings.drawStatus,
        }),
      });

      const result = await readApiResponse<DrawSettingsResponse>(response);

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to save draw settings.");
      }

      if (result.data?.settings) {
        setSettings({
          ...DEFAULT_SETTINGS,

          ...result.data.settings,
        });
      }

      setSuccess("Draw settings saved successfully.");
    } catch (requestError) {
      console.error("Save draw settings error:", requestError);

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to save draw settings.",
      );
    } finally {
      setSaving(false);
    }
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="rounded-xl bg-white p-5 shadow">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="mb-5">
        <h2 className="text-xl font-bold">Draw Control</h2>

        <p className="text-sm text-gray-500">
          Configure lottery draw schedules and result control.
        </p>
      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">Draw settings error</p>

          <p className="mt-1">{error}</p>
        </div>
      )}

      {/* ======================================================
          SUCCESS
      ====================================================== */}

      {success && (
        <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* ======================================================
          LOADING
      ====================================================== */}

      {loading ? (
        <div className="rounded-lg border bg-gray-50 px-5 py-12 text-center text-gray-500">
          <p className="font-medium">Loading draw settings...</p>

          <p className="mt-1 text-xs text-gray-400">
            Loading configuration from PostgreSQL
          </p>
        </div>
      ) : (
        <>
          {/* ==================================================
              LOTTERY DRAW ENABLE
          ================================================== */}

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* 2D */}

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <h3 className="font-semibold">2D Draw</h3>

                <p className="text-sm text-gray-500">Enable 2D draw</p>
              </div>

              <input
                type="checkbox"
                checked={settings.enable2DDraw}
                onChange={(event) =>
                  updateSetting("enable2DDraw", event.target.checked)
                }
                disabled={saving}
                className="h-5 w-5"
              />
            </div>

            {/* 3D */}

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <h3 className="font-semibold">3D Draw</h3>

                <p className="text-sm text-gray-500">Enable 3D draw</p>
              </div>

              <input
                type="checkbox"
                checked={settings.enable3DDraw}
                onChange={(event) =>
                  updateSetting("enable3DDraw", event.target.checked)
                }
                disabled={saving}
                className="h-5 w-5"
              />
            </div>
          </div>

          {/* ==================================================
              SCHEDULE
          ================================================== */}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Input
              label="2D Draw Time"
              type="time"
              value={settings.twoDDrawTime}
              onChange={(event) =>
                updateSetting("twoDDrawTime", event.target.value)
              }
              disabled={saving}
            />

            <Input
              label="3D Draw Time"
              type="time"
              value={settings.threeDDrawTime}
              onChange={(event) =>
                updateSetting("threeDDrawTime", event.target.value)
              }
              disabled={saving}
            />

            <Input
              label="2D Ticket Closing Time"
              type="time"
              value={settings.ticketClosingTime2D}
              onChange={(event) =>
                updateSetting("ticketClosingTime2D", event.target.value)
              }
              disabled={saving}
            />

            <Input
              label="3D Ticket Closing Time"
              type="time"
              value={settings.ticketClosingTime3D}
              onChange={(event) =>
                updateSetting("ticketClosingTime3D", event.target.value)
              }
              disabled={saving}
            />

            <Select
              label="Draw Status"
              value={settings.drawStatus}
              onChange={(event) =>
                updateSetting("drawStatus", event.target.value as DrawStatus)
              }
              disabled={saving}
              options={[
                {
                  label: "Open",
                  value: "Open",
                },
                {
                  label: "Closed",
                  value: "Closed",
                },
                {
                  label: "Suspended",
                  value: "Suspended",
                },
              ]}
            />
          </div>

          {/* ==================================================
              RESULT CONTROL
          ================================================== */}

          <div className="mt-6 space-y-4">
            <h3 className="font-semibold">Result Control</h3>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.manualResultEntry}
                onChange={(event) =>
                  updateSetting("manualResultEntry", event.target.checked)
                }
                disabled={saving}
                className="h-4 w-4"
              />

              <span>Manual Result Entry</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.resultPublishing}
                onChange={(event) =>
                  updateSetting("resultPublishing", event.target.checked)
                }
                disabled={saving}
                className="h-4 w-4"
              />

              <span>Result Publishing</span>
            </label>
          </div>

          {/* ==================================================
              DATABASE INFORMATION
          ================================================== */}

          {settings.updatedAt && (
            <div className="mt-5 rounded-lg bg-gray-50 px-4 py-3 text-xs text-gray-500">
              Last updated: {new Date(settings.updatedAt).toLocaleString()}
            </div>
          )}

          {/* ==================================================
              SAVE
          ================================================== */}

          <div className="mt-6 flex justify-end">
            <Button
              variant="success"
              onClick={() => void handleSave()}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Draw Settings"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
