import { useCallback, useEffect, useState } from "react";

import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Search,
  UserCheck,
  UserX,
  Users,
  XCircle,
} from "lucide-react";

import type { User, UserRole, UserStatus } from "@/types/user";

import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Modal from "@/components/common/Modal";

/* ============================================================
   TYPES
============================================================ */

interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

interface UsersData {
  users: User[];

  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
}

/* ============================================================
   COMPONENT
============================================================ */

export default function UserManagement() {
  /* ----------------------------------------------------------
     USERS
  ---------------------------------------------------------- */

  const [users, setUsers] = useState<User[]>([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  /* ----------------------------------------------------------
     PAGINATION
  ---------------------------------------------------------- */

  const [page, setPage] = useState(1);

  const [pageSize, setPageSize] = useState(10);

  const [total, setTotal] = useState(0);

  const [totalPages, setTotalPages] = useState(1);

  /* ----------------------------------------------------------
     FILTER
  ---------------------------------------------------------- */

  const [searchInput, setSearchInput] = useState("");

  const [search, setSearch] = useState("");

  const [roleFilter, setRoleFilter] = useState<"" | UserRole>("");

  const [statusFilter, setStatusFilter] = useState<"" | UserStatus>("");

  /* ----------------------------------------------------------
     MODAL
  ---------------------------------------------------------- */

  const [openModal, setOpenModal] = useState(false);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  /* ----------------------------------------------------------
     FORM
  ---------------------------------------------------------- */

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
      const params = new URLSearchParams();

      params.set("page", String(page));

      params.set("pageSize", String(pageSize));

      if (search) {
        params.set("search", search);
      }

      if (roleFilter) {
        params.set("role", roleFilter);
      }

      if (statusFilter) {
        params.set("status", statusFilter);
      }

      const response = await fetch(`/api/admin/users?${params.toString()}`, {
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
        throw new Error(result.message || "Failed to load users.");
      }

      setUsers(result.data?.users ?? []);

      setTotal(result.data?.pagination.total ?? 0);

      setTotalPages(result.data?.pagination.totalPages ?? 1);
    } catch (error) {
      console.error("Load users error:", error);

      setError(
        error instanceof Error ? error.message : "Failed to load users.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, roleFilter, statusFilter]);

  /* ==========================================================
     INITIAL / FILTER LOAD
  ========================================================== */

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  /* ==========================================================
     SEARCH
  ========================================================== */

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleSearchKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  /* ==========================================================
     RESET FILTERS
  ========================================================== */

  const resetFilters = () => {
    setSearchInput("");
    setSearch("");
    setRoleFilter("");
    setStatusFilter("");
    setPage(1);
  };

  /* ==========================================================
     PAGE SIZE
  ========================================================== */

  const handlePageSizeChange = (value: number) => {
    setPageSize(value);
    setPage(1);
  };

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
     PAGE NUMBERS
  ========================================================== */

  const getPageNumbers = () => {
    const pages: number[] = [];

    const start = Math.max(1, page - 2);

    const end = Math.min(totalPages, page + 2);

    for (let i = start; i <= end; i += 1) {
      pages.push(i);
    }

    return pages;
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="min-w-0">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Users size={22} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                User Management
              </h1>

              <p className="text-sm text-gray-500">
                {total.toLocaleString()} total users
              </p>
            </div>
          </div>
        </div>

        <Button variant="success" onClick={openCreate}>
          Add User
        </Button>
      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            className="text-red-500 hover:text-red-700"
          >
            <XCircle size={18} />
          </button>
        </div>
      )}

      {/* ======================================================
          FILTER PANEL
      ====================================================== */}

      <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row">
          {/* SEARCH */}

          <div className="flex-1">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search username, name, phone or email..."
                className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* ROLE */}

          <select
            value={roleFilter}
            onChange={(event) => {
              setRoleFilter(event.target.value as "" | UserRole);

              setPage(1);
            }}
            className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500"
          >
            <option value="">All Roles</option>

            <option value="PLAYER">Players</option>

            <option value="ADMIN">Admins</option>
          </select>

          {/* STATUS */}

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as "" | UserStatus);

              setPage(1);
            }}
            className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500"
          >
            <option value="">All Status</option>

            <option value="ACTIVE">Active</option>

            <option value="INACTIVE">Inactive</option>

            <option value="SUSPENDED">Suspended</option>
          </select>

          {/* SEARCH BUTTON */}

          <button
            type="button"
            onClick={handleSearch}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <Search size={16} />
            Search
          </button>

          {/* RESET */}

          {(search || roleFilter || statusFilter) && (
            <button
              type="button"
              onClick={resetFilters}
              className="h-10 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* ======================================================
          USER LIST
      ====================================================== */}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* LIST HEADER */}

        <div className="hidden border-b border-gray-200 bg-gray-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 lg:grid lg:grid-cols-[2fr_1.4fr_1fr_1.2fr_1fr_1.3fr_auto] lg:items-center lg:gap-4">
          <span>User</span>

          <span>Contact</span>

          <span>Role</span>

          <span className="text-right">Balance</span>

          <span>Status</span>

          <span>Created</span>

          <span>Action</span>
        </div>

        {/* LOADING */}

        {loading ? (
          <div className="space-y-3 p-5">
            {Array.from({
              length: 5,
            }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse rounded-xl bg-gray-100 p-5"
              >
                <div className="h-4 w-1/3 rounded bg-gray-200" />

                <div className="mt-3 h-3 w-1/2 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          /* EMPTY */

          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              <Users size={26} />
            </div>

            <h3 className="mt-4 font-semibold text-gray-900">No users found</h3>

            <p className="mt-1 text-sm text-gray-500">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          /* USERS */

          <div className="divide-y divide-gray-100">
            {users.map((user) => (
              <div
                key={user.id}
                className="px-4 py-4 transition hover:bg-gray-50 sm:px-5"
              >
                {/* DESKTOP */}

                <div className="hidden lg:grid lg:grid-cols-[2fr_1.4fr_1fr_1.2fr_1fr_1.3fr_auto] lg:items-center lg:gap-4">
                  {/* USER */}

                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
                      {(user.fullName || user.username).charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900">
                        {user.fullName || user.username}
                      </p>

                      <p className="truncate text-xs text-gray-500">
                        @{user.username}
                      </p>
                    </div>
                  </div>

                  {/* CONTACT */}

                  <div className="min-w-0">
                    <p className="truncate text-sm text-gray-700">
                      {user.phone}
                    </p>

                    <p className="truncate text-xs text-gray-400">
                      {user.email || "No email"}
                    </p>
                  </div>

                  {/* ROLE */}

                  <div>
                    <span
                      className={
                        user.role === "ADMIN"
                          ? "inline-flex rounded-full bg-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-700"
                          : "inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700"
                      }
                    >
                      {user.role}
                    </span>
                  </div>

                  {/* BALANCE */}

                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatBalance(user.balance)}
                    </p>
                  </div>

                  {/* STATUS */}

                  <div>
                    <span
                      className={
                        user.status === "ACTIVE"
                          ? "inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700"
                          : user.status === "SUSPENDED"
                            ? "inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700"
                            : "inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700"
                      }
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />

                      {user.status}
                    </span>
                  </div>

                  {/* CREATED */}

                  <div className="text-sm text-gray-500">
                    <p>{formatDate(user.createdAt)}</p>

                    <p className="mt-1 text-xs">
                      {user.isVerified ? (
                        <span className="text-green-600">Verified</span>
                      ) : (
                        <span className="text-gray-400">Not verified</span>
                      )}
                    </p>
                  </div>

                  {/* ACTION */}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(user)}
                      title="Edit user"
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Edit3 size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => void toggleStatus(user)}
                      title={
                        user.status === "ACTIVE"
                          ? "Disable user"
                          : "Enable user"
                      }
                      className={
                        user.status === "ACTIVE"
                          ? "flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50"
                          : "flex h-9 w-9 items-center justify-center rounded-lg border border-green-200 text-green-600 transition hover:bg-green-50"
                      }
                    >
                      {user.status === "ACTIVE" ? (
                        <UserX size={16} />
                      ) : (
                        <UserCheck size={16} />
                      )}
                    </button>
                  </div>
                </div>

                {/* MOBILE / TABLET */}

                <div className="lg:hidden">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
                        {(user.fullName || user.username)
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-900">
                          {user.fullName || user.username}
                        </p>

                        <p className="truncate text-xs text-gray-500">
                          @{user.username}
                        </p>
                      </div>
                    </div>

                    <span
                      className={
                        user.status === "ACTIVE"
                          ? "shrink-0 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700"
                          : user.status === "SUSPENDED"
                            ? "shrink-0 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700"
                            : "shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700"
                      }
                    >
                      {user.status}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-xs text-gray-400">Phone</p>

                      <p className="mt-1 truncate text-sm font-medium text-gray-800">
                        {user.phone}
                      </p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-xs text-gray-400">Role</p>

                      <p className="mt-1 text-sm font-semibold text-gray-800">
                        {user.role}
                      </p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-xs text-gray-400">Balance</p>

                      <p className="mt-1 truncate text-sm font-semibold text-gray-800">
                        {formatBalance(user.balance)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-xs text-gray-400">Created</p>

                      <p className="mt-1 text-sm font-medium text-gray-800">
                        {formatDate(user.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs text-gray-500">
                        {user.email || "No email"}
                      </p>

                      <p className="mt-1 flex items-center gap-1 text-xs">
                        {user.isVerified ? (
                          <>
                            <CheckCircle2
                              size={13}
                              className="text-green-600"
                            />

                            <span className="text-green-600">Verified</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={13} className="text-gray-400" />

                            <span className="text-gray-400">Not verified</span>
                          </>
                        )}
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(user)}
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <Edit3 size={15} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => void toggleStatus(user)}
                        className={
                          user.status === "ACTIVE"
                            ? "inline-flex h-9 items-center gap-2 rounded-lg border border-red-200 px-3 text-sm font-medium text-red-600 hover:bg-red-50"
                            : "inline-flex h-9 items-center gap-2 rounded-lg border border-green-200 px-3 text-sm font-medium text-green-600 hover:bg-green-50"
                        }
                      >
                        {user.status === "ACTIVE" ? (
                          <UserX size={15} />
                        ) : (
                          <UserCheck size={15} />
                        )}

                        {user.status === "ACTIVE" ? "Disable" : "Enable"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ====================================================
            PAGINATION
        ==================================================== */}

        {!loading && total > 0 && (
          <div className="border-t border-gray-200 bg-gray-50 px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* INFO */}

              <div className="text-sm text-gray-500">
                Showing{" "}
                <span className="font-medium text-gray-700">
                  {(page - 1) * pageSize + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium text-gray-700">
                  {Math.min(page * pageSize, total)}
                </span>{" "}
                of <span className="font-medium text-gray-700">{total}</span>{" "}
                users
              </div>

              {/* CONTROLS */}

              <div className="flex flex-wrap items-center gap-2">
                {/* PAGE SIZE */}

                <select
                  value={pageSize}
                  onChange={(event) =>
                    handlePageSizeChange(Number(event.target.value))
                  }
                  className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-sm text-gray-700 outline-none focus:border-blue-500"
                >
                  <option value={10}>10 / page</option>

                  <option value={20}>20 / page</option>

                  <option value={50}>50 / page</option>

                  <option value={100}>100 / page</option>
                </select>

                {/* PREVIOUS */}

                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={17} />
                </button>

                {/* PAGE NUMBERS */}

                {getPageNumbers().map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setPage(pageNumber)}
                    className={
                      pageNumber === page
                        ? "flex h-9 min-w-9 items-center justify-center rounded-lg bg-blue-600 px-2 text-sm font-semibold text-white"
                        : "flex h-9 min-w-9 items-center justify-center rounded-lg border border-gray-300 bg-white px-2 text-sm text-gray-600 transition hover:bg-gray-100"
                    }
                  >
                    {pageNumber}
                  </button>
                ))}

                {/* NEXT */}

                <button
                  type="button"
                  disabled={page >= totalPages || loading}
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================
          MODAL
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
