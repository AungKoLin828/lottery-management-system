import { useCallback, useEffect, useMemo, useState } from "react";

import type { User, UserRole, UserStatus } from "@/types/user";

import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Modal from "@/components/common/Modal";

interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

interface UsersData {
  users?: User[];
}

/* ============================================================
   COMPONENT
============================================================ */

export default function PlayerList() {
  const [users, setUsers] = useState<User[]>([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState("");

  const [openModal, setOpenModal] = useState(false);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  /* ==========================================================
     USER FORM
  ========================================================== */

  const [username, setUsername] = useState("");

  const [fullName, setFullName] = useState("");

  const [phone, setPhone] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [role, setRole] = useState<UserRole>("PLAYER");

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
     LOAD ALL USERS FROM API
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

      if (!contentType.toLowerCase().includes("application/json")) {
        const text = await response.text();

        console.error(
          "GET /api/admin/users returned non-JSON:",
          text.slice(0, 1000),
        );

        throw new Error(
          `API returned ${response.status} ${response.statusText} instead of JSON.`,
        );
      }

      const result = (await response.json()) as ApiResponse<UsersData>;

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load users.");
      }

      const allUsers = Array.isArray(result.data?.users)
        ? result.data.users
        : [];

      setUsers(allUsers);

      setCurrentPage((page) => {
        const newTotalPages = Math.max(
          1,
          Math.ceil(allUsers.length / itemsPerPage),
        );

        return page > newTotalPages ? newTotalPages : page;
      });
    } catch (error) {
      console.error("Load users error:", error);

      setUsers([]);

      setError(
        error instanceof Error ? error.message : "Failed to load users.",
      );
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage]);

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  /* ==========================================================
     RESET FORM
  ========================================================== */

  const resetForm = () => {
    setUsername("");
    setFullName("");
    setPhone("");
    setEmail("");
    setPassword("");
    setRole("PLAYER");
  };

  /* ==========================================================
     CREATE USER
  ========================================================== */

  const openCreate = () => {
    setSelectedUser(null);

    resetForm();

    setError("");

    setOpenModal(true);
  };

  /* ==========================================================
     EDIT USER
  ========================================================== */

  const openEdit = (user: User) => {
    setSelectedUser(user);

    setUsername(user.username ?? "");

    setFullName(user.fullName ?? "");

    setPhone(user.phone ?? "");

    setEmail(user.email ?? "");

    setPassword("");

    setRole(user.role);

    setError("");

    setOpenModal(true);
  };

  /* ==========================================================
     CLOSE MODAL
  ========================================================== */

  const closeModal = () => {
    if (saving || deletingId) {
      return;
    }

    setOpenModal(false);

    setSelectedUser(null);

    resetForm();
  };

  /* ==========================================================
     SAVE USER
  ========================================================== */

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");

    if (!username.trim()) {
      setError("Username is required.");
      return;
    }

    if (!phone.trim()) {
      setError("Phone number is required.");
      return;
    }

    if (!selectedUser && !password.trim()) {
      setError("Password is required.");
      return;
    }

    if (password && password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSaving(true);

    try {
      const body: Record<string, unknown> = {
        username: username.trim(),
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        role,
      };

      if (password.trim()) {
        body.password = password.trim();
      }

      const url = selectedUser
        ? `/api/admin/users/${encodeURIComponent(selectedUser.id)}`
        : "/api/admin/users";

      const response = await fetch(url, {
        method: selectedUser ? "PUT" : "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.toLowerCase().includes("application/json")) {
        const text = await response.text();

        console.error("Save user API returned non-JSON:", text.slice(0, 1000));

        throw new Error(
          `API returned ${response.status} ${response.statusText} instead of JSON.`,
        );
      }

      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to save user.");
      }

      setOpenModal(false);

      setSelectedUser(null);

      resetForm();

      await loadUsers();
    } catch (error) {
      console.error("Save user error:", error);

      setError(error instanceof Error ? error.message : "Failed to save user.");
    } finally {
      setSaving(false);
    }
  };

  /* ==========================================================
     TOGGLE STATUS
     
     ADMIN accounts cannot be disabled/enabled from this page.
  ========================================================== */

  const toggleStatus = async (user: User) => {
    /*
     * Protect ADMIN accounts.
     *
     * The Disable/Enable button is also disabled in the UI,
     * but this check prevents accidental calls if the function
     * is triggered another way.
     */
    if (user.role === "ADMIN") {
      setError("Admin accounts cannot be disabled or enabled.");
      return;
    }

    if (saving || deletingId) {
      return;
    }

    setError("");

    const status: UserStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    try {
      setSaving(true);

      const response = await fetch(
        `/api/admin/users/${encodeURIComponent(user.id)}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            status,
          }),
        },
      );

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.toLowerCase().includes("application/json")) {
        const text = await response.text();

        console.error("Status API returned non-JSON:", text.slice(0, 1000));

        throw new Error(
          `API returned ${response.status} ${response.statusText} instead of JSON.`,
        );
      }

      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update status.");
      }

      await loadUsers();
    } catch (error) {
      console.error("Status update error:", error);

      setError(
        error instanceof Error ? error.message : "Failed to update status.",
      );
    } finally {
      setSaving(false);
    }
  };

  /* ==========================================================
     DELETE USER
  ========================================================== */

  const handleDelete = async (user: User) => {
    /*
     * Protect ADMIN accounts.
     *
     * Admin accounts cannot be deleted from Player List.
     */
    if (user.role === "ADMIN") {
      setError("Admin accounts cannot be deleted.");
      return;
    }

    if (saving || deletingId) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete user "${user.username}"?\n\nThis action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setError("");

    setDeletingId(user.id);

    try {
      const response = await fetch(
        `/api/admin/users/${encodeURIComponent(user.id)}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        },
      );

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.toLowerCase().includes("application/json")) {
        const text = await response.text();

        console.error(
          "Delete user API returned non-JSON:",
          text.slice(0, 1000),
        );

        throw new Error(
          `API returned ${response.status} ${response.statusText} instead of JSON.`,
        );
      }

      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to delete user.");
      }

      /*
       * Remove immediately from local state.
       */
      setUsers((currentUsers) =>
        currentUsers.filter((currentUser) => currentUser.id !== user.id),
      );

      /*
       * Keep pagination valid after deletion.
       */
      setCurrentPage((page) => {
        const remainingUsers = users.length - 1;

        const newTotalPages = Math.max(
          1,
          Math.ceil(remainingUsers / itemsPerPage),
        );

        return Math.min(page, newTotalPages);
      });

      /*
       * Reload from database to make sure the UI
       * is synchronized with the backend.
       */
      await loadUsers();
    } catch (error) {
      console.error("Delete user error:", error);

      setError(
        error instanceof Error ? error.message : "Failed to delete user.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  /* ==========================================================
     FORMAT BALANCE
  ========================================================== */

  const formatBalance = (balance: number | undefined) => {
    const safeBalance =
      typeof balance === "number" && Number.isFinite(balance) ? balance : 0;

    return `${safeBalance.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })} MMK`;
  };

  /* ==========================================================
     FORMAT DATE
  ========================================================== */

  const formatDate = (value: string | undefined) => {
    if (!value) {
      return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
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

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Player List</h2>

          <p className="mt-1 text-sm text-gray-500">
            Manage all user accounts, roles, status and profile information.
          </p>
        </div>

        <Button variant="success" onClick={openCreate}>
          Add User
        </Button>
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
          USER LIST
      ====================================================== */}

      <div className="overflow-hidden rounded-xl bg-white shadow">
        {/* ====================================================
            DESKTOP
        ==================================================== */}

        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-[1200px] w-full">
            <thead>
              <tr className="bg-gray-100 text-left text-sm text-gray-600">
                <th className="p-3">Username</th>
                <th className="p-3">Name</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Status</th>
                <th className="p-3">Verified</th>
                <th className="p-3">Created</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-gray-500">
                    Loading users...
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-gray-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => {
                  const isAdmin = user.role === "ADMIN";
                  const isDeleting = deletingId === user.id;

                  return (
                    <tr
                      key={user.id}
                      className="border-b last:border-b-0 hover:bg-gray-50"
                    >
                      <td className="p-3 font-medium">{user.username}</td>

                      <td className="p-3">{user.fullName || "-"}</td>

                      <td className="p-3">{user.phone || "-"}</td>

                      <td className="p-3">{user.email || "-"}</td>

                      <td className="p-3">
                        <span
                          className={
                            isAdmin
                              ? "rounded-full bg-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-700"
                              : "rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700"
                          }
                        >
                          {user.role}
                        </span>
                      </td>

                      <td className="p-3">
                        <span
                          className={
                            user.status === "ACTIVE"
                              ? "rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700"
                              : user.status === "SUSPENDED"
                                ? "rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700"
                                : "rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700"
                          }
                        >
                          {user.status}
                        </span>
                      </td>

                      <td className="p-3">
                        {user.isVerified ? (
                          <span className="font-medium text-green-600">
                            Yes
                          </span>
                        ) : (
                          <span className="text-gray-400">No</span>
                        )}
                      </td>

                      <td className="p-3 text-sm text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>

                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            disabled={saving || deletingId !== null}
                            onClick={() => openEdit(user)}
                          >
                            Edit
                          </Button>

                          <Button
                            variant={
                              user.status === "ACTIVE" ? "danger" : "success"
                            }
                            disabled={isAdmin || saving || deletingId !== null}
                            onClick={() => void toggleStatus(user)}
                          >
                            {user.status === "ACTIVE" ? "Disable" : "Enable"}
                          </Button>

                          <Button
                            variant="danger"
                            disabled={isAdmin || saving || deletingId !== null}
                            onClick={() => void handleDelete(user)}
                          >
                            {isDeleting ? "Deleting..." : "Delete"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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
              Loading users...
            </div>
          ) : paginatedUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No users found.</div>
          ) : (
            <div className="divide-y">
              {paginatedUsers.map((user) => {
                const isAdmin = user.role === "ADMIN";
                const isDeleting = deletingId === user.id;

                return (
                  <div key={user.id} className="p-4">
                    {/* USER HEADER */}

                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-gray-900">
                          {user.username}
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                          {user.fullName || "-"}
                        </p>
                      </div>

                      <span
                        className={
                          user.status === "ACTIVE"
                            ? "rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700"
                            : user.status === "SUSPENDED"
                              ? "rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700"
                              : "rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700"
                        }
                      >
                        {user.status}
                      </span>
                    </div>

                    {/* USER INFORMATION */}

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-gray-400">Phone</div>

                        <div className="font-medium">{user.phone || "-"}</div>
                      </div>

                      <div>
                        <div className="text-gray-400">Role</div>

                        <div className="font-medium">{user.role}</div>
                      </div>

                      <div>
                        <div className="text-gray-400">Email</div>

                        <div className="break-all font-medium">
                          {user.email || "-"}
                        </div>
                      </div>

                      <div>
                        <div className="text-gray-400">Verified</div>

                        <div className="font-medium">
                          {user.isVerified ? "Yes" : "No"}
                        </div>
                      </div>

                      <div>
                        <div className="text-gray-400">Balance</div>

                        <div className="font-semibold text-blue-600">
                          {formatBalance(user.balance)}
                        </div>
                      </div>

                      <div>
                        <div className="text-gray-400">Created</div>

                        <div className="font-medium">
                          {formatDate(user.createdAt)}
                        </div>
                      </div>
                    </div>

                    {/* ACTIONS */}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        disabled={saving || deletingId !== null}
                        onClick={() => openEdit(user)}
                      >
                        Edit
                      </Button>

                      <Button
                        variant={
                          user.status === "ACTIVE" ? "danger" : "success"
                        }
                        disabled={isAdmin || saving || deletingId !== null}
                        onClick={() => void toggleStatus(user)}
                      >
                        {user.status === "ACTIVE" ? "Disable" : "Enable"}
                      </Button>

                      <Button
                        variant="danger"
                        disabled={isAdmin || saving || deletingId !== null}
                        onClick={() => void handleDelete(user)}
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
                  </div>
                );
              })}
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
              {users.length} users
            </div>

            <div className="flex max-w-full flex-wrap items-center gap-2">
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
          USER MODAL
      ====================================================== */}

      <Modal
        open={openModal}
        title={selectedUser ? "Edit User" : "Create User"}
        onClose={closeModal}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            disabled={saving}
          />

          <Input
            label="Full Name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            disabled={saving}
          />

          <Input
            label="Phone"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            disabled={saving}
          />

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={saving}
          />

          <Input
            label={selectedUser ? "New Password (Optional)" : "Password"}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={saving}
            placeholder={
              selectedUser
                ? "Leave blank to keep current password"
                : "Minimum 8 characters"
            }
          />

          {/* ROLE */}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Role
            </label>

            <select
              value={role}
              disabled={saving}
              onChange={(event) => setRole(event.target.value as UserRole)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="PLAYER">PLAYER</option>

              <option value="ADMIN">ADMIN</option>
            </select>
          </div>

          {/* EXISTING USER INFORMATION */}

          {selectedUser && (
            <div className="rounded-lg bg-gray-50 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>

                <strong>{selectedUser.status}</strong>
              </div>

              <div className="mt-2 flex justify-between">
                <span className="text-gray-500">Current Balance</span>

                <strong>{formatBalance(selectedUser.balance)}</strong>
              </div>

              {selectedUser.role === "ADMIN" && (
                <div className="mt-2 rounded-md bg-purple-50 px-3 py-2 text-xs text-purple-700">
                  Admin account: Disable/Enable and Delete actions are
                  protected.
                </div>
              )}
            </div>
          )}

          {/* ACTIONS */}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={saving || deletingId !== null}
              onClick={closeModal}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="success"
              disabled={saving || deletingId !== null}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
