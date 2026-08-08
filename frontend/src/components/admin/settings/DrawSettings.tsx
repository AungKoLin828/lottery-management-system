import { useState } from "react";

import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Select from "@/components/common/Select";

export default function DrawSettings() {
  const [settings, setSettings] = useState({
    enable2DDraw: true,
    enable3DDraw: true,

    twoDDrawTime: "16:30",
    threeDDrawTime: "16:30",

    ticketClosingTime2D: "16:00",
    ticketClosingTime3D: "16:00",

    manualResultEntry: true,
    resultPublishing: true,

    drawStatus: "Open",
  });

  const updateSetting = (
    key: keyof typeof settings,
    value: string | boolean,
  ) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = () => {
    console.log("Draw settings:", settings);

    alert("Draw settings saved successfully.");
  };

  return (
    <div className="bg-white rounded-xl shadow p-5">
      <div className="mb-5">
        <h2 className="text-xl font-bold">Draw Control</h2>

        <p className="text-sm text-gray-500">
          Configure lottery draw schedules and result control.
        </p>
      </div>

      {/* Lottery Draw Enable */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* 2D */}
        <div className="border rounded-lg p-4 flex justify-between items-center">
          <div>
            <h3 className="font-semibold">2D Draw</h3>

            <p className="text-sm text-gray-500">Enable 2D draw</p>
          </div>

          <input
            type="checkbox"
            checked={settings.enable2DDraw}
            onChange={(e) => updateSetting("enable2DDraw", e.target.checked)}
            className="w-5 h-5"
          />
        </div>

        {/* 3D */}
        <div className="border rounded-lg p-4 flex justify-between items-center">
          <div>
            <h3 className="font-semibold">3D Draw</h3>

            <p className="text-sm text-gray-500">Enable 3D draw</p>
          </div>

          <input
            type="checkbox"
            checked={settings.enable3DDraw}
            onChange={(e) => updateSetting("enable3DDraw", e.target.checked)}
            className="w-5 h-5"
          />
        </div>
      </div>

      {/* Schedule */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Input
          label="2D Draw Time"
          type="time"
          value={settings.twoDDrawTime}
          onChange={(e) => updateSetting("twoDDrawTime", e.target.value)}
        />

        <Input
          label="3D Draw Time"
          type="time"
          value={settings.threeDDrawTime}
          onChange={(e) => updateSetting("threeDDrawTime", e.target.value)}
        />

        <Input
          label="2D Ticket Closing Time"
          type="time"
          value={settings.ticketClosingTime2D}
          onChange={(e) => updateSetting("ticketClosingTime2D", e.target.value)}
        />

        <Input
          label="3D Ticket Closing Time"
          type="time"
          value={settings.ticketClosingTime3D}
          onChange={(e) => updateSetting("ticketClosingTime3D", e.target.value)}
        />

        <Select
          label="Draw Status"
          value={settings.drawStatus}
          onChange={(e) => updateSetting("drawStatus", e.target.value)}
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

      {/* Result Control */}
      <div className="mt-6 space-y-4">
        <h3 className="font-semibold">Result Control</h3>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.manualResultEntry}
            onChange={(e) =>
              updateSetting("manualResultEntry", e.target.checked)
            }
            className="w-4 h-4"
          />

          <span>Manual Result Entry</span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.resultPublishing}
            onChange={(e) =>
              updateSetting("resultPublishing", e.target.checked)
            }
            className="w-4 h-4"
          />

          <span>Result Publishing</span>
        </label>
      </div>

      <div className="flex justify-end mt-6">
        <Button variant="success" onClick={handleSave}>
          Save Draw Settings
        </Button>
      </div>
    </div>
  );
}
