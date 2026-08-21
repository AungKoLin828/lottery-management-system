import { useCallback, useEffect, useState } from "react";

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
  users: User[];
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [openModal, setOpenModal] = useState(false);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [username, setUsername] = useState("");

  const [fullName, setFullName] = useState("");

  const [phone, setPhone] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [role, setRole] = useState<UserRole>("PLAYER");

  /* ==========================================================
     LOAD USERS
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

      /*
       * Prevent:
       *
       * Unexpected token '<'
       *
       * when Netlify returns
       * index.html.
       */

      if (!contentType.includes("application/json")) {
        const text = await response.text();

        console.error("Expected JSON but received:", text.slice(0, 500));

        throw new Error(
          `API returned ${response.status} ${response.statusText} instead of JSON.`,
        );
      }

      const result = (await response.json()) as ApiResponse<UsersData>;

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load users.");
      }

      setUsers(result.data?.users ?? []);
    } catch (error) {
      console.error("Load users error:", error);

      setError(
        error instanceof Error ? error.message : "Failed to load users.",
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
     CREATE
  ========================================================== */

  const openCreate = () => {
    setSelectedUser(null);

    resetForm();

    setError("");

    setOpenModal(true);
  };

  /* ==========================================================
     EDIT
  ========================================================== */

  const openEdit = (user: User) => {
    setSelectedUser(user);

    setUsername(user.username);

    setFullName(user.fullName ?? "");

    setPhone(user.phone);

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
    if (saving) {
      return;
    }

    setOpenModal(false);

    setSelectedUser(null);

    resetForm();
  };

  /* ==========================================================
     SAVE
  ========================================================== */

  const handleSave = async (event: React.FormEvent) => {
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

      if (!contentType.includes("application/json")) {
        const text = await response.text();

        console.error("Save API returned:", text.slice(0, 500));

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
  ========================================================== */

  const toggleStatus = async (user: User) => {
    setError("");

    const status: UserStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    try {
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

      if (!contentType.includes("application/json")) {
        const text = await response.text();

        console.error("Status API returned:", text.slice(0, 500));

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
    }
  };

  /* ==========================================================
     BALANCE
  ========================================================== */

  const formatBalance = (balance: number) => {
    return `${balance.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })} MMK`;
  };

  /* ==========================================================
     DATE
  ========================================================== */

  const formatDate = (value: string) => {
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
     RENDER
  ========================================================== */

  return (
    <div className="min-w-0">
      {/* HEADER */}

      <div
        className="
          mb-6
          flex
          flex-col
          gap-3
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage users, roles, status and wallet balances.
          </p>
        </div>

        <Button variant="success" onClick={openCreate}>
          Add User
        </Button>
      </div>

      {/* ERROR */}

      {error && (
        <div
          className="
            mb-5
            rounded-lg
            border
            border-red-200
            bg-red-50
            px-4
            py-3
            text-sm
            text-red-700
          "
        >
          {error}
        </div>
      )}

      {/* TABLE */}

      <div className="overflow-hidden rounded-xl bg-white shadow">
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full">
            <thead>
              <tr className="bg-gray-100 text-left text-sm">
                <th className="p-3">Username</th>

                <th className="p-3">Name</th>

                <th className="p-3">Phone</th>

                <th className="p-3">Email</th>

                <th className="p-3">Role</th>

                <th className="p-3 text-right">Balance</th>

                <th className="p-3">Status</th>

                <th className="p-3">Verified</th>

                <th className="p-3">Created</th>

                <th className="p-3">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-10 text-center text-gray-500">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-10 text-center text-gray-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b last:border-b-0 hover:bg-gray-50"
                  >
                    <td className="p-3 font-medium">{user.username}</td>

                    <td className="p-3">{user.fullName || "-"}</td>

                    <td className="p-3">{user.phone}</td>

                    <td className="p-3">{user.email || "-"}</td>

                    <td className="p-3">
                      <span
                        className={
                          user.role === "ADMIN"
                            ? "rounded-full bg-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-700"
                            : "rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700"
                        }
                      >
                        {user.role}
                      </span>
                    </td>

                    <td className="p-3 text-right font-medium">
                      {formatBalance(user.balance)}
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
                        <span className="text-green-600">Yes</span>
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
                          onClick={() => openEdit(user)}
                        >
                          Edit
                        </Button>

                        <Button
                          variant={
                            user.status === "ACTIVE" ? "danger" : "success"
                          }
                          onClick={() => void toggleStatus(user)}
                        >
                          {user.status === "ACTIVE" ? "Disable" : "Enable"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}

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

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Role
            </label>

            <select
              value={role}
              disabled={saving}
              onChange={(event) => setRole(event.target.value as UserRole)}
              className="
                w-full
                rounded-md
                border
                border-gray-300
                bg-white
                px-3
                py-2
                text-sm
                outline-none
                focus:border-blue-500
                focus:ring-1
                focus:ring-blue-500
              "
            >
              <option value="PLAYER">PLAYER</option>

              <option value="ADMIN">ADMIN</option>
            </select>
          </div>

          {selectedUser && (
            <div className="rounded-lg bg-gray-50 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>

                <strong>{selectedUser.status}</strong>
              </div>

              <div className="mt-2 flex justify-between">
                <span className="text-gray-500">Balance</span>

                <strong>{formatBalance(selectedUser.balance)}</strong>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={closeModal}
            >
              Cancel
            </Button>

            <Button type="submit" variant="success" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
