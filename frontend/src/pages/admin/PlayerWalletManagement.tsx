import { useCallback, useEffect, useMemo, useState } from "react";

import type { User } from "@/types/user";

import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Modal from "@/components/common/Modal";

interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

interface UsersData {
  users: User[];
}

type BalanceAction = "ADD" | "DEDUCT";

/* ============================================================
   COMPONENT
============================================================ */

export default function PlayerWalletManagement() {
  const [users, setUsers] = useState<User[]>([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [openModal, setOpenModal] = useState(false);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  /* ==========================================================
     BALANCE FORM
  ========================================================== */

  const [balanceAction, setBalanceAction] = useState<BalanceAction>("ADD");

  const [balanceAmount, setBalanceAmount] = useState("");

  const [balanceNote, setBalanceNote] = useState("");

  /* ==========================================================
     PAGINATION
  ========================================================== */

  const [currentPage, setCurrentPage] = useState(1);

  const [itemsPerPage, setItemsPerPage] = useState(10);

  const totalPages = Math.max(1, Math.ceil(users.length / itemsPerPage));

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;

    return users.slice(start, start + itemsPerPage);
  }, [users, currentPage, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  /* ==========================================================
     LOAD PLAYERS
  ========================================================== */

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/users", {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        const text = await response.text();

        console.error("Expected JSON but received:", text.slice(0, 500));

        throw new Error(
          `API returned ${response.status} ${response.statusText} instead of JSON.`,
        );
      }

      const result = (await response.json()) as ApiResponse<UsersData>;

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load players.");
      }

      const allUsers = result.data?.users ?? [];

      setUsers(allUsers.filter((user) => user.role === "PLAYER"));
    } catch (error) {
      console.error("Load wallet users error:", error);

      setError(
        error instanceof Error ? error.message : "Failed to load players.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  /* ==========================================================
     FORMAT BALANCE
  ========================================================== */

  const formatBalance = (balance: number) => {
    return `${balance.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })} MMK`;
  };

  /* ==========================================================
     OPEN BALANCE
  ========================================================== */

  const openBalance = (user: User) => {
    setSelectedUser(user);

    setBalanceAction("ADD");

    setBalanceAmount("");

    setBalanceNote("");

    setError("");

    setOpenModal(true);
  };

  /* ==========================================================
     CLOSE BALANCE
  ========================================================== */

  const closeBalance = () => {
    if (saving) {
      return;
    }

    setOpenModal(false);

    setSelectedUser(null);

    setBalanceAction("ADD");

    setBalanceAmount("");

    setBalanceNote("");
  };

  /* ==========================================================
     SAVE BALANCE
  ========================================================== */

  const handleBalanceSave = async (event: React.FormEvent) => {
    event.preventDefault();

    setError("");

    if (!selectedUser) {
      setError("No player selected.");

      return;
    }

    const amount = Number(balanceAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Please enter a valid amount greater than 0.");

      return;
    }

    if (amount > 1000000000) {
      setError("Amount is too large.");

      return;
    }

    if (balanceAction === "DEDUCT" && amount > selectedUser.balance) {
      setError(
        `Insufficient balance. Current balance is ${formatBalance(
          selectedUser.balance,
        )}.`,
      );

      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `/api/admin/users/${encodeURIComponent(selectedUser.id)}/balance`,
        {
          method: "POST",

          credentials: "include",

          headers: {
            "Content-Type": "application/json",

            Accept: "application/json",
          },

          body: JSON.stringify({
            amount,
            type: balanceAction,
            note: balanceNote.trim(),
          }),
        },
      );

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        const text = await response.text();

        console.error("Balance API returned:", text.slice(0, 500));

        throw new Error(
          `API returned ${response.status} ${response.statusText} instead of JSON.`,
        );
      }

      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update player balance.");
      }

      setOpenModal(false);

      setSelectedUser(null);

      setBalanceAction("ADD");

      setBalanceAmount("");

      setBalanceNote("");

      await loadUsers();
    } catch (error) {
      console.error("Balance update error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update player balance.",
      );
    } finally {
      setSaving(false);
    }
  };

  /* ==========================================================
     PAGE NUMBERS
  ========================================================== */

  const pageNumbers = Array.from(
    {
      length: totalPages,
    },
    (_, index) => index + 1,
  );

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="min-w-0">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          Player Wallet Management
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Manage player wallet balances, including adding and deducting balance.
        </p>
      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ======================================================
          WALLET TABLE
      ====================================================== */}

      <div className="overflow-hidden rounded-xl bg-white shadow">
        {/* DESKTOP */}

        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-[800px] w-full">
            <thead>
              <tr className="bg-gray-100 text-left text-sm text-gray-600">
                <th className="p-3">Username</th>

                <th className="p-3">Player Name</th>

                <th className="p-3">Phone</th>

                <th className="p-3 text-right">Balance</th>

                <th className="p-3">Status</th>

                <th className="p-3">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-gray-500">
                    Loading players...
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-gray-500">
                    No players found.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b last:border-b-0 hover:bg-gray-50"
                  >
                    <td className="p-3 font-medium">{user.username}</td>

                    <td className="p-3">{user.fullName || "-"}</td>

                    <td className="p-3">{user.phone}</td>

                    <td className="p-3 text-right font-bold text-blue-600">
                      {formatBalance(user.balance)}
                    </td>

                    <td className="p-3">
                      <span
                        className={
                          user.status === "ACTIVE"
                            ? "rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700"
                            : "rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700"
                        }
                      >
                        {user.status}
                      </span>
                    </td>

                    <td className="p-3">
                      <Button
                        variant="outline"
                        onClick={() => openBalance(user)}
                      >
                        Manage Wallet
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ====================================================
            MOBILE
        ==================================================== */}

        <div className="md:hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Loading players...
            </div>
          ) : paginatedUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No players found.
            </div>
          ) : (
            <div className="divide-y">
              {paginatedUsers.map((user) => (
                <div key={user.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-gray-900">
                        {user.username}
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        {user.fullName || "-"}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                      PLAYER
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-gray-400">Phone</div>

                      <div className="font-medium">{user.phone}</div>
                    </div>

                    <div>
                      <div className="text-gray-400">Status</div>

                      <div className="font-medium">{user.status}</div>
                    </div>

                    <div className="col-span-2 rounded-lg bg-blue-50 p-3">
                      <div className="text-xs text-gray-500">
                        Current Balance
                      </div>

                      <div className="mt-1 text-xl font-bold text-blue-600">
                        {formatBalance(user.balance)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Button variant="outline" onClick={() => openBalance(user)}>
                      Manage Wallet
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ====================================================
            PAGINATION
        ==================================================== */}

        {!loading && users.length > 0 && (
          <div className="flex flex-col gap-3 border-t bg-gray-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, users.length)} of{" "}
              {users.length} players
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={itemsPerPage}
                onChange={(event) => {
                  setItemsPerPage(Number(event.target.value));

                  setCurrentPage(1);
                }}
                className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm"
              >
                <option value={5}>5 / page</option>

                <option value={10}>10 / page</option>

                <option value={20}>20 / page</option>

                <option value={50}>50 / page</option>
              </select>

              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                className="rounded-md border bg-white px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              {pageNumbers.map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={
                    page === currentPage
                      ? "rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white"
                      : "rounded-md border bg-white px-3 py-1.5 text-sm hover:bg-gray-100"
                  }
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                className="rounded-md border bg-white px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================
          BALANCE MODAL
      ====================================================== */}

      <Modal
        open={openModal}
        title="Update Player Wallet"
        onClose={closeBalance}
      >
        {selectedUser && (
          <form onSubmit={handleBalanceSave} className="space-y-5">
            {/* PLAYER */}

            <div className="rounded-xl border bg-gray-50 p-4">
              <div className="text-sm text-gray-500">Player</div>

              <div className="mt-1 font-semibold text-gray-900">
                {selectedUser.username}
              </div>

              <div className="mt-2 text-sm text-gray-500">Current Balance</div>

              <div className="mt-1 text-xl font-bold text-blue-600">
                {formatBalance(selectedUser.balance)}
              </div>
            </div>

            {/* ACTION */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Wallet Action
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setBalanceAction("ADD")}
                  className={
                    balanceAction === "ADD"
                      ? "rounded-lg border-2 border-green-500 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700"
                      : "rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
                  }
                >
                  + Add Balance
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setBalanceAction("DEDUCT")}
                  className={
                    balanceAction === "DEDUCT"
                      ? "rounded-lg border-2 border-red-500 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
                      : "rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
                  }
                >
                  − Deduct Balance
                </button>
              </div>
            </div>

            {/* AMOUNT */}

            <Input
              label="Amount (MMK)"
              type="number"
              min="1"
              step="0.01"
              value={balanceAmount}
              onChange={(event) => setBalanceAmount(event.target.value)}
              disabled={saving}
              placeholder="Enter amount"
            />

            {/* NOTE */}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Note
              </label>

              <textarea
                value={balanceNote}
                onChange={(event) => setBalanceNote(event.target.value)}
                disabled={saving}
                rows={3}
                placeholder="Reason for wallet adjustment"
                className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* PREVIEW */}

            {Number(balanceAmount) > 0 && (
              <div className="rounded-lg border bg-white p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Current</span>

                  <span>{formatBalance(selectedUser.balance)}</span>
                </div>

                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-gray-500">Adjustment</span>

                  <span
                    className={
                      balanceAction === "ADD"
                        ? "font-semibold text-green-600"
                        : "font-semibold text-red-600"
                    }
                  >
                    {balanceAction === "ADD" ? "+" : "-"}
                    {formatBalance(Number(balanceAmount))}
                  </span>
                </div>

                <div className="mt-2 border-t pt-2">
                  <div className="flex justify-between">
                    <span className="font-medium">New Balance</span>

                    <span className="font-bold text-blue-600">
                      {formatBalance(
                        balanceAction === "ADD"
                          ? selectedUser.balance + Number(balanceAmount)
                          : selectedUser.balance - Number(balanceAmount),
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ACTIONS */}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={closeBalance}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant={balanceAction === "ADD" ? "success" : "danger"}
                disabled={saving}
              >
                {saving
                  ? "Updating..."
                  : balanceAction === "ADD"
                    ? "Add Balance"
                    : "Deduct Balance"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
