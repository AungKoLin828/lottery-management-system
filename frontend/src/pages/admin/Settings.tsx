import { useState } from "react";

import type { SystemSettings } from "@/types/settings";

import Button from "@/components/common/Button";
import Input from "@/components/common/Input";

export default function Settings() {
  const [settings, setSettings] = useState<SystemSettings>({
    id: 1,

    systemName: "2D Lottery System",

    currency: "MMK",

    phone: "09123456789",

    email: "admin@lottery.com",

    address: "Yangon, Myanmar",

    minDeposit: 1000,

    maxDeposit: 1000000,

    minWithdraw: 5000,

    maxWithdraw: 500000,

    maintenanceMode: false,

    announcement: "Welcome to Lottery System",
  });

  const handleChange = (field: keyof SystemSettings, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    console.log(settings);

    alert("Settings saved successfully");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">System Settings</h1>

      <div className="bg-white shadow rounded-xl p-6 max-w-3xl">
        <form onSubmit={handleSave} className="space-y-5">
          <Input
            label="System Name"
            value={settings.systemName}
            onChange={(e) => handleChange("systemName", e.target.value)}
          />

          <Input
            label="Currency"
            value={settings.currency}
            onChange={(e) => handleChange("currency", e.target.value)}
          />

          <Input
            label="Phone"
            value={settings.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
          />

          <Input
            label="Email"
            value={settings.email}
            onChange={(e) => handleChange("email", e.target.value)}
          />

          <Input
            label="Address"
            value={settings.address}
            onChange={(e) => handleChange("address", e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Minimum Deposit"
              type="number"
              value={settings.minDeposit}
              onChange={(e) =>
                handleChange("minDeposit", Number(e.target.value))
              }
            />

            <Input
              label="Maximum Deposit"
              type="number"
              value={settings.maxDeposit}
              onChange={(e) =>
                handleChange("maxDeposit", Number(e.target.value))
              }
            />

            <Input
              label="Minimum Withdraw"
              type="number"
              value={settings.minWithdraw}
              onChange={(e) =>
                handleChange("minWithdraw", Number(e.target.value))
              }
            />

            <Input
              label="Maximum Withdraw"
              type="number"
              value={settings.maxWithdraw}
              onChange={(e) =>
                handleChange("maxWithdraw", Number(e.target.value))
              }
            />
          </div>

          <div>
            <label className="font-medium">Announcement</label>

            <textarea
              className="border rounded w-full p-3 mt-2"
              rows={4}
              value={settings.announcement}
              onChange={(e) => handleChange("announcement", e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.maintenanceMode}
              onChange={(e) =>
                handleChange("maintenanceMode", e.target.checked)
              }
            />

            <label>Maintenance Mode</label>
          </div>

          <div className="flex justify-end">
            <Button type="submit" variant="success">
              Save Settings
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
