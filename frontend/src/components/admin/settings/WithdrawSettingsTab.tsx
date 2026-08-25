import Button from "@/components/common/Button";
import Input from "@/components/common/Input";

import type { WithdrawSettings, PaymentMethod } from "@/types/settings";

interface WithdrawSettingsTabProps {
  settings: WithdrawSettings;

  setSettings: React.Dispatch<React.SetStateAction<WithdrawSettings>>;

  paymentMethods: PaymentMethod[];
}

export default function WithdrawSettingsTab({
  settings,
  setSettings,
  paymentMethods,
}: WithdrawSettingsTabProps) {
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
    if (settings.minimumWithdraw > settings.maximumWithdraw) {
      alert("Minimum withdraw cannot exceed maximum withdraw.");

      return;
    }

    console.log("Withdraw Settings:", settings);

    alert("Withdraw settings saved successfully.");
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <h2 className="mb-6 text-xl font-bold">Withdraw Settings</h2>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Input
          label="Minimum Withdraw"
          type="number"
          value={String(settings.minimumWithdraw)}
          onChange={(e) =>
            setSettings((prev) => ({
              ...prev,
              minimumWithdraw: Number(e.target.value),
            }))
          }
        />

        <Input
          label="Maximum Withdraw"
          type="number"
          value={String(settings.maximumWithdraw)}
          onChange={(e) =>
            setSettings((prev) => ({
              ...prev,
              maximumWithdraw: Number(e.target.value),
            }))
          }
        />

        <Input
          label="Daily Withdraw Limit"
          type="number"
          value={String(settings.dailyWithdrawLimit)}
          onChange={(e) =>
            setSettings((prev) => ({
              ...prev,
              dailyWithdrawLimit: Number(e.target.value),
            }))
          }
        />

        <Input
          label="Withdraw Fee"
          type="number"
          value={String(settings.withdrawFee)}
          onChange={(e) =>
            setSettings((prev) => ({
              ...prev,
              withdrawFee: Number(e.target.value),
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
          placeholder="10-30 minutes"
        />
      </div>

      {/* OPTIONS */}

      <div className="mt-6 space-y-4">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.approvalRequired}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                approvalRequired: e.target.checked,
              }))
            }
          />

          <span>Approval Required</span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.autoWithdraw}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                autoWithdraw: e.target.checked,
              }))
            }
          />

          <span>Auto Withdraw</span>
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
                (method.type === "Withdraw" || method.type === "Both"),
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

      {/* SAVE */}

      <div className="mt-6 flex justify-end">
        <Button variant="success" onClick={saveSettings}>
          Save Withdraw Settings
        </Button>
      </div>
    </div>
  );
}
