import { useNavigate } from "react-router-dom";

import Button from "@/components/common/Button";

export default function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      label: "Add Result",
      path: "/admin/results/add",
      icon: "🎯",
    },

    {
      label: "Approve Deposit",
      path: "/admin/deposits",
      icon: "💰",
    },

    {
      label: "Approve Withdraw",
      path: "/admin/withdraws",
      icon: "💸",
    },

    {
      label: "Add Player",
      path: "/admin/players/create",
      icon: "👤",
    },

    {
      label: "Payment Methods",
      path: "/admin/settings/payment-methods",
      icon: "💳",
    },

    {
      label: "Reports",
      path: "/admin/reports",
      icon: "📊",
    },

    {
      label: "Settings",
      path: "/admin/settings",
      icon: "⚙️",
    },

    {
      label: "User Management",
      path: "/admin/users",
      icon: "👥",
    },
  ];

  return (
    <div
      className="
      bg-white
      rounded-xl
      shadow
      p-5
      "
    >
      <h2
        className="
        font-bold
        text-lg
        mb-4
        "
      >
        Quick Actions
      </h2>

      <div
        className="
        grid
        grid-cols-2
        gap-3
        "
      >
        {actions.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            onClick={() => navigate(action.path)}
          >
            <span className="mr-2">{action.icon}</span>

            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
