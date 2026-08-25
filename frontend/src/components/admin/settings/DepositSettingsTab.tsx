import Button from "@/components/common/Button";
import Input from "@/components/common/Input";

import type { DepositSettings, PaymentMethod } from "@/types/settings";

interface DepositSettingsTabProps {
  settings: DepositSettings;

  setSettings: React.Dispatch<React.SetStateAction<DepositSettings>>;

  paymentMethods: PaymentMethod[];
}

export default function DepositSettingsTab({
  settings,
  setSettings,
  paymentMethods,
}: DepositSettingsTabProps) {
  const togglePaymentMethod = (id: number) => {
    setSettings((prev) => {
      const exists = prev.allowedPaymentMethods.includes(id);

      return {
        ...prev,
        allowedPaymentMethods: exists
          ? prev.allowedPaymentMethods.filter((methodId) => methodId !== id)
          : [...prev.allowedPaymentMethods, id],
      };
    });
  };

  const saveSettings = () => {
    if (settings.minimumDeposit > settings.maximumDeposit) {
      alert("Minimum deposit cannot exceed maximum deposit.");

      return;
    }

    console.log("Deposit Settings:", settings);

    alert("Deposit settings saved successfully.");
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <h2 className="mb-6 text-xl font-bold">Deposit Settings</h2>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Input
          label="Minimum Deposit"
          type="number"
          value={String(settings.minimumDeposit)}
          onChange={(e) =>
            setSettings((prev) => ({
              ...prev,
              minimumDeposit: Number(e.target.value),
            }))
          }
        />

        <Input
          label="Maximum Deposit"
          type="number"
          value={String(settings.maximumDeposit)}
          onChange={(e) =>
            setSettings((prev) => ({
              ...prev,
              maximumDeposit: Number(e.target.value),
            }))
          }
        />

        <Input
          label="Daily Deposit Limit"
          type="number"
          value={String(settings.dailyDepositLimit)}
          onChange={(e) =>
            setSettings((prev) => ({
              ...prev,
              dailyDeposit: Number(e.target.value),
            }))
          }
        />

        <Input
          label="Processing Time"
          value={settings.processingTime}
          onChange={(e) =>
            setSettings((prev) => ({
              ...prev,
              processingTime: e.target.value,
            }))
          }
          placeholder="5-15 minutes"
        />
      </div>

      {/* APPROVAL */}

      <div className="mt-6 space-y-4">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.autoApproval}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                autoApproval: e.target.checked,
                manualApproval: !e.target.checked,
              }))
            }
          />

          <span>Auto Approval</span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.manualApproval}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                manualApproval: e.target.checked,
                autoApproval: !e.target.checked,
              }))
            }
          />

          <span>Manual Approval</span>
        </label>
      </div>

      {/* PAYMENT METHODS */}

      <div className="mt-6">
        <h3 className="mb-3 font-semibold">Allowed Payment Methods</h3>

        <div className="space-y-2">
          {paymentMethods
            .filter(
              (method) =>
                method.enabled &&
                (method.type === "Deposit" || method.type === "Both"),
            )
            .map((method) => (
              <label key={method.id} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.allowedPaymentMethods.includes(method.id)}
                  onChange={() => togglePaymentMethod(method.id)}
                />

                <span>{method.name}</span>
              </label>
            ))}
        </div>
      </div>

      {/* NOTE */}

      <div className="mt-6">
        <label className="mb-1 block text-sm font-medium">Deposit Note</label>

        <textarea
          className="w-full rounded-lg border p-3"
          rows={4}
          value={settings.depositNote}
          onChange={(e) =>
            setSettings((prev) => ({
              ...prev,
              depositNote: e.target.value,
            }))
          }
        />
      </div>

      {/* SAVE */}

      <div className="mt-6 flex justify-end">
        <Button variant="success" onClick={saveSettings}>
          Save Deposit Settings
        </Button>
      </div>
    </div>
  );
}
