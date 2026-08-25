import type { SettingsTab } from "@/pages/admin/Settings";

interface SettingsTabsProps {
  activeTab: SettingsTab;
  onChange: (tab: SettingsTab) => void;
}

const tabs: {
  id: SettingsTab;
  label: string;
}[] = [
  {
    id: "general",
    label: "General",
  },
  {
    id: "payment",
    label: "Payment Methods",
  },
  {
    id: "lottery",
    label: "Lottery Number Control",
  },
  {
    id: "deposit",
    label: "Deposit Settings",
  },
  {
    id: "withdraw",
    label: "Withdraw Settings",
  },
  {
    id: "maintenance",
    label: "Maintenance",
  },
];

export default function SettingsTabs({
  activeTab,
  onChange,
}: SettingsTabsProps) {
  return (
    <div className="rounded-xl bg-white p-4 shadow">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`
              rounded-lg
              px-4
              py-2
              font-medium
              transition
              ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
