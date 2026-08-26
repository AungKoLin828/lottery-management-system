import { useCallback, useEffect, useState } from "react";

import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Modal from "@/components/common/Modal";

import type { PaymentMethod, PaymentMethodType } from "@/types/settings";

/* ============================================================
   TYPES
============================================================ */

interface PaymentMethodsTabProps {
  paymentMethods: PaymentMethod[];

  setPaymentMethods: React.Dispatch<React.SetStateAction<PaymentMethod[]>>;

  onDelete?: (id: string) => void;
}

interface ApiResponse<T = unknown> {
  success: boolean;

  message?: string;

  data?: T;
}

interface PaymentMethodsResponse {
  paymentMethods?: PaymentMethod[];

  methods?: PaymentMethod[];

  setting?: PaymentMethod;

  paymentMethod?: PaymentMethod;
}

interface PaymentMethodResponse {
  paymentMethod?: PaymentMethod;

  method?: PaymentMethod;
}

/* ============================================================
   FORM TYPE
============================================================ */

type PaymentMethodForm = {
  name: string;

  type: PaymentMethodType;

  enabled: boolean;

  accountName: string;

  accountNumber: string;

  bankName: string;

  branch: string;

  displayOrder: number;
};

/* ============================================================
   EMPTY FORM
============================================================ */

const emptyPaymentMethod: PaymentMethodForm = {
  name: "",

  type: "Both",

  enabled: true,

  accountName: "",

  accountNumber: "",

  bankName: "",

  branch: "",

  displayOrder: 1,
};

/* ============================================================
   API HELPER
============================================================ */

async function parseApiResponse<T>(
  response: Response,
): Promise<ApiResponse<T>> {
  const contentType = response.headers.get("content-type") || "";

  /*
   * Always read the response as text first.
   *
   * This prevents:
   *
   * Unexpected token '<'
   *
   * when Netlify/Vite returns an HTML
   * error page instead of JSON.
   */
  const text = await response.text();

  if (!text.trim()) {
    throw new Error(
      `API returned ${response.status} ${response.statusText} with an empty response.`,
    );
  }

  if (!contentType.toLowerCase().includes("application/json")) {
    console.error(
      "Payment methods API returned non-JSON:",
      text.slice(0, 2000),
    );

    throw new Error(
      `API returned ${response.status} ${response.statusText} instead of JSON.`,
    );
  }

  try {
    return JSON.parse(text) as ApiResponse<T>;
  } catch (error) {
    console.error(
      "Failed to parse payment methods API JSON:",
      error,
      text.slice(0, 2000),
    );

    throw new Error("The payment methods API returned invalid JSON.");
  }
}

/* ============================================================
   COMPONENT
============================================================ */

export default function PaymentMethodsTab({
  paymentMethods,
  setPaymentMethods,
  onDelete,
}: PaymentMethodsTabProps) {
  /* ==========================================================
     MODAL
  ========================================================== */

  const [showModal, setShowModal] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<PaymentMethodForm>(emptyPaymentMethod);

  /* ==========================================================
     LOADING / SAVING
  ========================================================== */

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [togglingId, setTogglingId] = useState<string | null>(null);

  /* ==========================================================
     MESSAGES
  ========================================================== */

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  /* ==========================================================
     CLEAR MESSAGES
  ========================================================== */

  const clearMessages = () => {
    setError("");

    setSuccess("");
  };

  /* ==========================================================
     NORMALIZE PAYMENT METHOD
  ========================================================== */

  const normalizePaymentMethod = (method: PaymentMethod): PaymentMethod => {
    return {
      ...method,

      id: method.id,

      name: method.name ?? "",

      type: method.type ?? "Both",

      enabled: method.enabled !== false,

      accountName: method.accountName ?? "",

      accountNumber: method.accountNumber ?? "",

      bankName: method.bankName ?? "",

      branch: method.branch ?? "",

      displayOrder: Number(method.displayOrder) || 1,
    };
  };

  /* ==========================================================
     LOAD PAYMENT METHODS
  ========================================================== */

  const loadPaymentMethods = useCallback(async () => {
    setLoading(true);

    setError("");

    try {
      const response = await fetch("/api/admin/payment-methods", {
        method: "GET",

        credentials: "include",

        headers: {
          Accept: "application/json",
        },

        cache: "no-store",
      });

      const result = await parseApiResponse<PaymentMethodsResponse>(response);

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            `Failed to load payment methods. (${response.status})`,
        );
      }

      /*
       * Primary expected response:
       *
       * data.paymentMethods
       *
       * Also support:
       *
       * data.methods
       */
      const methods = result.data?.paymentMethods ?? result.data?.methods ?? [];

      if (!Array.isArray(methods)) {
        throw new Error("Invalid payment methods data returned by the API.");
      }

      const normalizedMethods = methods.map(normalizePaymentMethod);

      setPaymentMethods(normalizedMethods);
    } catch (loadError) {
      console.error("Load payment methods error:", loadError);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load payment methods.",
      );
    } finally {
      setLoading(false);
    }
  }, [setPaymentMethods]);

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    void loadPaymentMethods();
  }, [loadPaymentMethods]);

  /* ==========================================================
     OPEN ADD
  ========================================================== */

  const openAdd = () => {
    clearMessages();

    setEditingId(null);

    setForm({
      ...emptyPaymentMethod,

      displayOrder: paymentMethods.length + 1,
    });

    setShowModal(true);
  };

  /* ==========================================================
     OPEN EDIT
  ========================================================== */

  const openEdit = (method: PaymentMethod) => {
    clearMessages();

    /*
     * IMPORTANT:
     *
     * Always convert the DB ID to string.
     *
     * This prevents:
     *
     * number !== string
     *
     * comparison problems when the DB returns
     * UUID/string IDs.
     */
    const id = String(method.id);

    setEditingId(id);

    setForm({
      name: method.name ?? "",

      type:
        method.type === "Deposit" ||
        method.type === "Withdraw" ||
        method.type === "Both"
          ? method.type
          : "Both",

      enabled: method.enabled !== false,

      accountName: method.accountName ?? "",

      accountNumber: method.accountNumber ?? "",

      bankName: method.bankName ?? "",

      branch: method.branch ?? "",

      displayOrder: Number(method.displayOrder) || 1,
    });

    setShowModal(true);
  };

  /* ==========================================================
     CLOSE MODAL
  ========================================================== */

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);

    setEditingId(null);

    setForm({
      ...emptyPaymentMethod,
    });
  };

  /* ==========================================================
     VALIDATE FORM
  ========================================================== */

  const validateForm = (): boolean => {
    if (!form.name.trim()) {
      setError("Payment method name is required.");

      return false;
    }

    if (!form.accountName.trim()) {
      setError("Account name is required.");

      return false;
    }

    if (!form.accountNumber.trim()) {
      setError("Account number is required.");

      return false;
    }

    if (!Number.isInteger(form.displayOrder) || form.displayOrder <= 0) {
      setError("Display order must be a positive integer.");

      return false;
    }

    return true;
  };

  /* ==========================================================
     EXTRACT SAVED PAYMENT METHOD
  ========================================================== */

  const extractPaymentMethod = (
    data: PaymentMethodResponse | PaymentMethodsResponse | undefined,
  ): PaymentMethod | null => {
    if (!data) {
      return null;
    }

    if ("paymentMethod" in data && data.paymentMethod) {
      return normalizePaymentMethod(data.paymentMethod);
    }

    if ("method" in data && data.method) {
      return normalizePaymentMethod(data.method);
    }

    return null;
  };

  /* ==========================================================
     SAVE PAYMENT METHOD
  ========================================================== */

  const savePaymentMethod = async () => {
    clearMessages();

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      const isEditing = editingId !== null;

      const payload = {
        ...(isEditing
          ? {
              id: editingId,
            }
          : {}),

        name: form.name.trim(),

        type: form.type,

        enabled: form.enabled,

        accountName: form.accountName.trim(),

        accountNumber: form.accountNumber.trim(),

        bankName: form.bankName.trim(),

        branch: form.branch.trim(),

        displayOrder: form.displayOrder,
      };

      console.log(
        isEditing ? "Updating payment method:" : "Creating payment method:",
        payload,
      );

      const response = await fetch("/api/admin/payment-methods", {
        method: isEditing ? "PUT" : "POST",

        credentials: "include",

        headers: {
          "Content-Type": "application/json",

          Accept: "application/json",
        },

        body: JSON.stringify(payload),
      });

      const result = await parseApiResponse<PaymentMethodResponse>(response);

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            `Failed to ${isEditing ? "update" : "create"} payment method.`,
        );
      }

      /*
       * Try to get the payment method
       * returned by the API.
       */
      const savedMethod = extractPaymentMethod(result.data);

      /*
       * Close modal first.
       */
      setShowModal(false);

      setEditingId(null);

      setForm({
        ...emptyPaymentMethod,
      });

      /*
       * IMPORTANT:
       *
       * Reload directly from DB.
       *
       * This guarantees the frontend is
       * synchronized with PostgreSQL even
       * if the API response format changes.
       */
      await loadPaymentMethods();

      if (savedMethod) {
        setSuccess(
          isEditing
            ? "Payment method updated successfully."
            : "Payment method added successfully.",
        );
      } else {
        setSuccess(
          isEditing
            ? "Payment method updated successfully."
            : "Payment method added successfully.",
        );
      }
    } catch (saveError) {
      console.error("Save payment method error:", saveError);

      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save payment method.",
      );
    } finally {
      setSaving(false);
    }
  };

  /* ==========================================================
     TOGGLE ENABLED
  ========================================================== */

  const togglePaymentMethod = async (method: PaymentMethod) => {
    const id = String(method.id);

    clearMessages();

    setTogglingId(id);

    try {
      const response = await fetch("/api/admin/payment-methods", {
        method: "PUT",

        credentials: "include",

        headers: {
          "Content-Type": "application/json",

          Accept: "application/json",
        },

        body: JSON.stringify({
          id,

          name: method.name,

          type: method.type,

          enabled: !method.enabled,

          accountName: method.accountName,

          accountNumber: method.accountNumber,

          bankName: method.bankName,

          branch: method.branch,

          displayOrder: method.displayOrder,
        }),
      });

      const result = await parseApiResponse<PaymentMethodResponse>(response);

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to update payment method status.",
        );
      }

      /*
       * Reload from real database.
       */
      await loadPaymentMethods();

      setSuccess(
        `${method.name} ${
          !method.enabled ? "enabled" : "disabled"
        } successfully.`,
      );
    } catch (toggleError) {
      console.error("Toggle payment method error:", toggleError);

      setError(
        toggleError instanceof Error
          ? toggleError.message
          : "Failed to update payment method status.",
      );
    } finally {
      setTogglingId(null);
    }
  };

  /* ==========================================================
     DELETE
  ========================================================== */

  const deletePaymentMethod = async (idValue: string) => {
    const id = String(idValue);

    const method = paymentMethods.find((item) => String(item.id) === id);

    const confirmed = window.confirm(
      `Are you sure you want to delete "${
        method?.name ?? "this payment method"
      }"?`,
    );

    if (!confirmed) {
      return;
    }

    clearMessages();

    setDeletingId(id);

    try {
      const response = await fetch("/api/admin/payment-methods", {
        method: "DELETE",

        credentials: "include",

        headers: {
          "Content-Type": "application/json",

          Accept: "application/json",
        },

        body: JSON.stringify({
          id,
        }),
      });

      const result = await parseApiResponse(response);

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to delete payment method.");
      }

      /*
       * Reload from PostgreSQL.
       */
      await loadPaymentMethods();

      /*
       * Keep parent callback compatibility.
       */
      onDelete?.(id);

      setSuccess("Payment method deleted successfully.");
    } catch (deleteError) {
      console.error("Delete payment method error:", deleteError);

      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete payment method.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  /* ==========================================================
     SORT
  ========================================================== */

  const sortedPaymentMethods = [...paymentMethods]
    .map(normalizePaymentMethod)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <div className="rounded-xl bg-white p-8 shadow">
        <div className="flex flex-col items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600" />

          <p className="mt-4 text-sm text-gray-500">
            Loading payment methods...
          </p>
        </div>
      </div>
    );
  }

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="space-y-6">
      {/* ======================================================
          MESSAGES
      ======================================================= */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* ======================================================
          MAIN CARD
      ======================================================= */}

      <div className="rounded-xl bg-white p-6 shadow">
        {/* HEADER */}

        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">Payment Methods</h2>

            <p className="text-sm text-gray-500">
              Manage deposit and withdraw payment methods.
            </p>
          </div>

          <Button
            variant="success"
            onClick={openAdd}
            disabled={saving || deletingId !== null || togglingId !== null}
          >
            + Add Payment Method
          </Button>
        </div>

        {/* ====================================================
            TABLE
        ==================================================== */}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b bg-gray-100">
                <th className="p-3 text-left">#</th>

                <th className="p-3 text-left">Name</th>

                <th className="p-3 text-left">Type</th>

                <th className="p-3 text-left">Account</th>

                <th className="p-3 text-left">Account Number</th>

                <th className="p-3 text-left">Status</th>

                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {sortedPaymentMethods.length > 0 ? (
                sortedPaymentMethods.map((method) => {
                  const id = String(method.id);

                  const isDeleting = deletingId === id;

                  const isToggling = togglingId === id;

                  return (
                    <tr key={id} className="border-b last:border-b-0">
                      {/* ORDER */}

                      <td className="p-3">{method.displayOrder}</td>

                      {/* NAME */}

                      <td className="p-3 font-medium">{method.name}</td>

                      {/* TYPE */}

                      <td className="p-3">
                        <span className="rounded bg-gray-100 px-2 py-1 text-sm">
                          {method.type}
                        </span>
                      </td>

                      {/* ACCOUNT NAME */}

                      <td className="p-3">{method.accountName}</td>

                      {/* ACCOUNT NUMBER */}

                      <td className="p-3">{method.accountNumber}</td>

                      {/* STATUS */}

                      <td className="p-3">
                        <button
                          type="button"
                          disabled={isDeleting || isToggling || saving}
                          onClick={() => void togglePaymentMethod(method)}
                          className={`rounded-full px-3 py-1 text-sm transition ${
                            method.enabled
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-red-100 text-red-700 hover:bg-red-200"
                          } ${isToggling ? "cursor-wait opacity-60" : ""}`}
                        >
                          {isToggling
                            ? "Updating..."
                            : method.enabled
                              ? "Enabled"
                              : "Disabled"}
                        </button>
                      </td>

                      {/* ACTION */}

                      <td className="p-3">
                        <div className="flex justify-center gap-2">
                          {/* EDIT */}

                          <Button
                            variant="outline"
                            disabled={isDeleting || isToggling || saving}
                            onClick={() => openEdit(method)}
                          >
                            Edit
                          </Button>

                          {/* DELETE */}

                          <Button
                            variant="danger"
                            disabled={isDeleting || isToggling || saving}
                            onClick={() => void deletePaymentMethod(id)}
                          >
                            {isDeleting ? "Deleting..." : "Delete"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="p-10 text-center text-sm text-gray-500"
                  >
                    No payment methods found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================
          ADD / EDIT MODAL
      ======================================================= */}

      <Modal
        open={showModal}
        title={
          editingId !== null ? "Edit Payment Method" : "Add Payment Method"
        }
        onClose={closeModal}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();

            void savePaymentMethod();
          }}
          className="space-y-4"
        >
          {/* ==================================================
              NAME
          ================================================== */}

          <Input
            label="Payment Method Name"
            value={form.name}
            disabled={saving}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                name: event.target.value,
              }))
            }
            placeholder="KBZPay"
          />

          {/* ==================================================
              TYPE
          ================================================== */}

          <div>
            <label className="mb-1 block text-sm font-medium">Type</label>

            <select
              disabled={saving}
              className="w-full rounded-lg border border-gray-300 bg-white p-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-100"
              value={form.type}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,

                  type: event.target.value as PaymentMethodType,
                }))
              }
            >
              <option value="Deposit">Deposit</option>

              <option value="Withdraw">Withdraw</option>

              <option value="Both">Both</option>
            </select>
          </div>

          {/* ==================================================
              ACCOUNT NAME
          ================================================== */}

          <Input
            label="Account Name"
            value={form.accountName}
            disabled={saving}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,

                accountName: event.target.value,
              }))
            }
            placeholder="Lottery Admin"
          />

          {/* ==================================================
              ACCOUNT NUMBER
          ================================================== */}

          <Input
            label="Account Number"
            value={form.accountNumber}
            disabled={saving}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,

                accountNumber: event.target.value,
              }))
            }
            placeholder="09123456789"
          />

          {/* ==================================================
              BANK NAME
          ================================================== */}

          <Input
            label="Bank Name"
            value={form.bankName}
            disabled={saving}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,

                bankName: event.target.value,
              }))
            }
            placeholder="KBZ Bank"
          />

          {/* ==================================================
              BRANCH
          ================================================== */}

          <Input
            label="Branch"
            value={form.branch}
            disabled={saving}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,

                branch: event.target.value,
              }))
            }
            placeholder="Yangon Main Branch"
          />

          {/* ==================================================
              DISPLAY ORDER
          ================================================== */}

          <Input
            label="Display Order"
            type="number"
            min={1}
            value={String(form.displayOrder)}
            disabled={saving}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,

                displayOrder: Number(event.target.value),
              }))
            }
          />

          {/* ==================================================
              ENABLED
          ================================================== */}

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.enabled}
              disabled={saving}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,

                  enabled: event.target.checked,
                }))
              }
              className="h-4 w-4"
            />

            <span className="text-sm font-medium text-gray-700">Enabled</span>
          </label>

          {/* ==================================================
              ACTIONS
          ================================================== */}

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
              {saving ? "Saving..." : editingId !== null ? "Update" : "Save"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
