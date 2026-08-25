import Button from "@/components/common/Button";

import type { MaintenanceSettings } from "@/types/settings";

interface MaintenanceSettingsTabProps {
  settings: MaintenanceSettings;

  setSettings: React.Dispatch<React.SetStateAction<MaintenanceSettings>>;
}

export default function MaintenanceSettingsTab({
  settings,
  setSettings,
}: MaintenanceSettingsTabProps) {
  const saveSettings = () => {
    console.log("Maintenance Settings:", settings);

    alert("Maintenance settings saved successfully.");
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow">
      {/* HEADER */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Maintenance</h2>

          <p className="text-sm text-gray-500">Control system availability.</p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-sm ${
            settings.maintenanceMode
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {settings.maintenanceMode ? "Maintenance ON" : "System Active"}
        </span>
      </div>

      <div className="space-y-5">
        {/* MAINTENANCE MODE */}

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.maintenanceMode}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                maintenanceMode: e.target.checked,
              }))
            }
          />

          <span className="font-medium">Maintenance Mode</span>
        </label>

        {/* MESSAGE */}

        <div>
          <label className="mb-1 block text-sm font-medium">
            Maintenance Message
          </label>

          <textarea
            className="w-full rounded-lg border p-3"
            rows={4}
            value={settings.maintenanceMessage}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                maintenanceMessage: e.target.value,
              }))
            }
          />
        </div>

        {/* ADMIN LOGIN */}

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.allowAdminLogin}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                allowAdminLogin: e.target.checked,
              }))
            }
          />

          <span>Allow Admin Login</span>
        </label>

        {/* PLAYER LOGIN */}

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.disablePlayerLogin}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                disablePlayerLogin: e.target.checked,
              }))
            }
          />

          <span>Disable Player Login</span>
        </label>

        {/* TICKET PURCHASE */}

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.disableTicketPurchase}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                disableTicketPurchase: e.target.checked,
              }))
            }
          />

          <span>Disable Ticket Purchase</span>
        </label>

        {/* DEPOSIT */}

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.disableDeposit}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                disableDeposit: e.target.checked,
              }))
            }
          />

          <span>Disable Deposit</span>
        </label>

        {/* WITHDRAW */}

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.disableWithdraw}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                disableWithdraw: e.target.checked,
              }))
            }
          />

          <span>Disable Withdraw</span>
        </label>

        {/* SCHEDULE */}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Scheduled Start
            </label>

            <input
              type="datetime-local"
              className="w-full rounded-lg border p-2"
              value={settings.scheduledStart}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  scheduledStart: e.target.value,
                }))
              }
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Scheduled End
            </label>

            <input
              type="datetime-local"
              className="w-full rounded-lg border p-2"
              value={settings.scheduledEnd}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  scheduledEnd: e.target.value,
                }))
              }
            />
          </div>
        </div>
      </div>

      {/* SAVE */}

      <div className="mt-6 flex justify-end">
        <Button variant="success" onClick={saveSettings}>
          Save Maintenance Settings
        </Button>
      </div>
    </div>
  );
}
