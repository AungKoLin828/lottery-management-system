import Button from "@/components/common/Button";
import Input from "@/components/common/Input";

import type { GeneralSettings } from "@/types/settings";

interface GeneralSettingsTabProps {
  settings: GeneralSettings;
  setSettings: React.Dispatch<React.SetStateAction<GeneralSettings>>;
}

export default function GeneralSettingsTab({
  settings,
  setSettings,
}: GeneralSettingsTabProps) {
  const handleChange = (field: keyof GeneralSettings, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveSettings = () => {
    console.log("General Settings:", settings);

    alert("General settings saved successfully.");
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <h2 className="mb-6 text-xl font-bold">General Settings</h2>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Input
          label="System Name"
          value={settings.systemName}
          onChange={(e) => handleChange("systemName", e.target.value)}
        />

        <div>
          <label className="mb-1 block text-sm font-medium">Currency</label>

          <select
            className="w-full rounded-lg border p-2"
            value={settings.currency}
            onChange={(e) => handleChange("currency", e.target.value)}
          >
            <option value="MMK">MMK</option>
            <option value="THB">THB</option>
            <option value="USD">USD</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Time Zone</label>

          <select
            className="w-full rounded-lg border p-2"
            value={settings.timeZone}
            onChange={(e) => handleChange("timeZone", e.target.value)}
          >
            <option value="Asia/Yangon">Asia/Yangon</option>
            <option value="Asia/Bangkok">Asia/Bangkok</option>
            <option value="Asia/Tokyo">Asia/Tokyo</option>
            <option value="UTC">UTC</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Language</label>

          <select
            className="w-full rounded-lg border p-2"
            value={settings.language}
            onChange={(e) => handleChange("language", e.target.value)}
          >
            <option value="English">English</option>
            <option value="Myanmar">Myanmar</option>
            <option value="Japanese">Japanese</option>
          </select>
        </div>

        <Input
          label="Contact Phone"
          value={settings.contactPhone}
          onChange={(e) => handleChange("contactPhone", e.target.value)}
        />

        <Input
          label="Contact Email"
          type="email"
          value={settings.contactEmail}
          onChange={(e) => handleChange("contactEmail", e.target.value)}
        />

        <Input
          label="Facebook"
          value={settings.facebook}
          onChange={(e) => handleChange("facebook", e.target.value)}
        />

        <Input
          label="Telegram"
          value={settings.telegram}
          onChange={(e) => handleChange("telegram", e.target.value)}
        />

        <Input
          label="Viber"
          value={settings.viber}
          onChange={(e) => handleChange("viber", e.target.value)}
        />
      </div>

      <div className="mt-5">
        <label className="mb-1 block text-sm font-medium">Address</label>

        <textarea
          className="w-full rounded-lg border p-3"
          rows={3}
          value={settings.address}
          onChange={(e) => handleChange("address", e.target.value)}
        />
      </div>

      <div className="mt-5">
        <label className="mb-1 block text-sm font-medium">Announcement</label>

        <textarea
          className="w-full rounded-lg border p-3"
          rows={4}
          value={settings.announcement}
          onChange={(e) => handleChange("announcement", e.target.value)}
        />
      </div>

      <div className="mt-6 flex justify-end">
        <Button variant="success" onClick={saveSettings}>
          Save General Settings
        </Button>
      </div>
    </div>
  );
}
