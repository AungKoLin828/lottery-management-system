import SummaryCard from "@/components/admin/dashboard/SummaryCard";

import RevenueChart from "@/components/admin/dashboard/RevenueChart";

import TicketChart from "@/components/admin/dashboard/TicketChart";

import RecentTransactions from "@/components/admin/dashboard/RecentTransactions";

import PendingDeposits from "@/components/admin/dashboard/PendingDeposits";

import PendingWithdraws from "@/components/admin/dashboard/PendingWithdraws";

import PlayerStatistics from "@/components/admin/dashboard/PlayerStatistics";

import QuickActions from "@/components/admin/dashboard/QuickActions";

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Page Title */}

      <h1
        className="
        text-3xl
        font-bold
        "
      >
        Admin Dashboard
      </h1>

      {/* Summary Cards */}

      <div
        className="
        grid
        grid-cols-1
        md:grid-cols-3
        gap-5
        "
      >
        <SummaryCard title="Today Sales" value="2,500,000 MMK" icon="🎟" />

        <SummaryCard title="Deposit" value="800,000 MMK" icon="💰" />

        <SummaryCard title="Withdraw" value="300,000 MMK" icon="💸" />
      </div>

      {/* Charts */}

      <div
        className="
        grid
        grid-cols-1
        lg:grid-cols-2
        gap-5
        "
      >
        <RevenueChart />

        <TicketChart />
      </div>

      {/* Deposit / Withdraw */}

      <div
        className="
        grid
        grid-cols-1
        lg:grid-cols-2
        gap-5
        "
      >
        <PendingDeposits />

        <PendingWithdraws />
      </div>

      {/* Player Statistics */}

      <div
        className="
        grid
        grid-cols-1
        gap-5
        "
      >
        <PlayerStatistics />
      </div>

      {/* Transaction + Quick Actions */}

      <div
        className="
        grid
        grid-cols-1
        lg:grid-cols-2
        gap-5
        "
      >
        <RecentTransactions />

        <QuickActions />
      </div>
    </div>
  );
}
