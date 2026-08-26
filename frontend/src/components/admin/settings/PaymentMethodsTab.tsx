import { useEffect, useRef, useState } from "react";

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
   API CONFIGURATION
============================================================ */

/*
 * Prevent an API request from hanging forever.
 *
 * If the Netlify function / database becomes unavailable,
 * the UI will stop loading after this amount of time.
 */
const API_TIMEOUT_MS = 15000;

/* ============================================================
   API HELPER
============================================================ */

async function parseApiResponse<T>(
  response: Response,
): Promise<ApiResponse<T>> {
  const contentType = response.headers.get("content-type") || "";

  const text = await response.text();

  if (!text.trim()) {
    throw new Error(
      `API returned ${response.status} ${response.statusText} with an empty response.`,
    );
  }

  /*
   * Some servers may return JSON with a slightly different
   * content-type. Try JSON parsing first instead of immediately
   * rejecting it.
   */
  try {
    return JSON.parse(text) as ApiResponse<T>;
  } catch (error) {
    console.error("Failed to parse payment methods API response:", error, {
      status: response.status,
      statusText: response.statusText,
      contentType,
      body: text.slice(0, 2000),
    });

    if (!contentType.toLowerCase().includes("application/json")) {
      throw new Error(
        `API returned ${response.status} ${response.statusText} instead of JSON.`,
      );
    }

    throw new Error("The payment methods API returned invalid JSON.");
  }
}

/* ============================================================
   FETCH WITH TIMEOUT
============================================================ */

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = API_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();

  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const externalSignal = init.signal;

  /*
   * If the caller already has an AbortSignal, abort this
   * request when the caller aborts.
   */
  const handleExternalAbort = () => {
    controller.abort();
  };

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener("abort", handleExternalAbort, {
        once: true,
      });
    }
  }

  timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(input, {
      ...init,

      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted) {
      /*
       * Distinguish timeout from normal external cancellation.
       */
      if (!externalSignal?.aborted) {
        throw new Error(
          "The payment methods request timed out. Please try again.",
        );
      }
    }

    throw error;
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    if (externalSignal) {
      externalSignal.removeEventListener("abort", handleExternalAbort);
    }
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
     COMPONENT LIFECYCLE
  ========================================================== */

  const mountedRef = useRef(true);

  const loadingRequestRef = useRef<AbortController | null>(null);

  const loadingInProgressRef = useRef(false);

  /* ==========================================================
     MODAL
  ========================================================== */

  const [showModal, setShowModal] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<PaymentMethodForm>(emptyPaymentMethod);

  /* ==========================================================
     LOADING / SAVING
  ========================================================== */

  /*
   * IMPORTANT:
   *
   * initialLoading controls only the first page load.
   *
   * refreshing is used for subsequent DB reloads.
   *
   * Therefore save/toggle/delete will NOT replace the entire
   * table with an infinite/full-page spinner.
   */
  const [initialLoading, setInitialLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [togglingId, setTogglingId] = useState<string | null>(null);

  /* ==========================================================
     MESSAGES
  ========================================================== */

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  /* ==========================================================
     MOUNT / UNMOUNT
  ========================================================== */

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      /*
       * Cancel an active loading request when the component
       * is removed.
       */
      loadingRequestRef.current?.abort();

      loadingRequestRef.current = null;

      loadingInProgressRef.current = false;
    };
  }, []);

  /* ==========================================================
     CLEAR MESSAGES
  ========================================================== */

  const clearMessages = () => {
    if (!mountedRef.current) {
      return;
    }

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
    };
  };

  /* ==========================================================
     LOAD PAYMENT METHODS
  ========================================================== */

  const loadPaymentMethods = async (
    options: {
      initial?: boolean;
      showError?: boolean;
    } = {},
  ): Promise<boolean> => {
    const { initial = false, showError = true } = options;

    /*
     * Prevent duplicate simultaneous GET requests.
     *
     * This is especially important during React development
     * where effects can be invoked more than once.
     */
    if (loadingInProgressRef.current) {
      return false;
    }

    loadingInProgressRef.current = true;

    /*
     * Cancel any previous request.
     */
    loadingRequestRef.current?.abort();

    const controller = new AbortController();

    loadingRequestRef.current = controller;

    if (mountedRef.current) {
      if (initial) {
        setInitialLoading(true);
      } else {
        setRefreshing(true);
      }

      if (showError) {
        setError("");
      }
    }

    try {
      const response = await fetchWithTimeout(
        "/api/admin/payment-methods",
        {
          method: "GET",

          credentials: "include",

          headers: {
            Accept: "application/json",
          },

          cache: "no-store",

          signal: controller.signal,
        },
        API_TIMEOUT_MS,
      );

      /*
       * If component was unmounted or request was cancelled,
       * do not update React state.
       */
      if (!mountedRef.current || controller.signal.aborted) {
        return false;
      }

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

      if (mountedRef.current) {
        setPaymentMethods(normalizedMethods);
      }

      return true;
    } catch (loadError) {
      /*
       * Abort errors caused by component unmount/request
       * cancellation should not be displayed to the user.
       */
      if (controller.signal.aborted || !mountedRef.current) {
        return false;
      }

      console.error("Load payment methods error:", loadError);

      if (showError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load payment methods.",
        );
      }

      return false;
    } finally {
      if (loadingRequestRef.current === controller) {
        loadingRequestRef.current = null;
      }

      loadingInProgressRef.current = false;

      if (mountedRef.current) {
        if (initial) {
          setInitialLoading(false);
        } else {
          setRefreshing(false);
        }
      }
    }
  };

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    /*
     * Intentionally run only once.
     *
     * Do NOT put loadPaymentMethods in this dependency array.
     *
     * This prevents the repeated loading loop caused by a
     * callback being recreated by parent renders.
     */
    void loadPaymentMethods({
      initial: true,
      showError: true,
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    if (saving) {
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

      const response = await fetchWithTimeout(
        "/api/admin/payment-methods",
        {
          method: isEditing ? "PUT" : "POST",

          credentials: "include",

          headers: {
            "Content-Type": "application/json",

            Accept: "application/json",
          },

          body: JSON.stringify(payload),
        },
        API_TIMEOUT_MS,
      );

      const result = await parseApiResponse<PaymentMethodResponse>(response);

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            `Failed to ${isEditing ? "update" : "create"} payment method.`,
        );
      }

      /*
       * Extract API response if available.
       */
      const savedMethod = extractPaymentMethod(result.data);

      /*
       * Close modal immediately after successful DB
       * operation.
       */
      if (mountedRef.current) {
        setShowModal(false);

        setEditingId(null);

        setForm({
          ...emptyPaymentMethod,
        });
      }

      /*
       * Refresh DB data.
       *
       * This uses "refreshing", NOT "initialLoading",
       * so the table remains visible while refreshing.
       */
      const refreshed = await loadPaymentMethods({
        initial: false,
        showError: true,
      });

      if (!mountedRef.current) {
        return;
      }

      if (!refreshed) {
        /*
         * The save itself succeeded even if the subsequent
         * GET refresh failed.
         */
        setSuccess(
          isEditing
            ? "Payment method updated successfully, but the list could not be refreshed."
            : "Payment method added successfully, but the list could not be refreshed.",
        );

        return;
      }

      setSuccess(
        savedMethod || isEditing
          ? isEditing
            ? "Payment method updated successfully."
            : "Payment method added successfully."
          : "Payment method added successfully.",
      );
    } catch (saveError) {
      console.error("Save payment method error:", saveError);

      if (!mountedRef.current) {
        return;
      }

      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save payment method.",
      );
    } finally {
      if (mountedRef.current) {
        setSaving(false);
      }
    }
  };

  /* ==========================================================
     TOGGLE ENABLED
  ========================================================== */

  const togglePaymentMethod = async (method: PaymentMethod) => {
    const id = String(method.id);

    if (togglingId !== null || saving) {
      return;
    }

    clearMessages();

    setTogglingId(id);

    try {
      const response = await fetchWithTimeout(
        "/api/admin/payment-methods",
        {
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
        },
        API_TIMEOUT_MS,
      );

      const result = await parseApiResponse<PaymentMethodResponse>(response);

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to update payment method status.",
        );
      }

      /*
       * Refresh from PostgreSQL without replacing the
       * current table with the initial loading screen.
       */
      const refreshed = await loadPaymentMethods({
        initial: false,
        showError: true,
      });

      if (!mountedRef.current) {
        return;
      }

      if (!refreshed) {
        setSuccess(
          `${method.name} ${
            !method.enabled ? "enabled" : "disabled"
          } successfully, but the list could not be refreshed.`,
        );

        return;
      }

      setSuccess(
        `${method.name} ${
          !method.enabled ? "enabled" : "disabled"
        } successfully.`,
      );
    } catch (toggleError) {
      console.error("Toggle payment method error:", toggleError);

      if (!mountedRef.current) {
        return;
      }

      setError(
        toggleError instanceof Error
          ? toggleError.message
          : "Failed to update payment method status.",
      );
    } finally {
      if (mountedRef.current) {
        setTogglingId(null);
      }
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

    if (deletingId !== null || saving) {
      return;
    }

    clearMessages();

    setDeletingId(id);

    try {
      const response = await fetchWithTimeout(
        "/api/admin/payment-methods",
        {
          method: "DELETE",

          credentials: "include",

          headers: {
            "Content-Type": "application/json",

            Accept: "application/json",
          },

          body: JSON.stringify({
            id,
          }),
        },
        API_TIMEOUT_MS,
      );

      const result = await parseApiResponse(response);

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to delete payment method.");
      }

      /*
       * Refresh from PostgreSQL.
       */
      const refreshed = await loadPaymentMethods({
        initial: false,
        showError: true,
      });

      if (!mountedRef.current) {
        return;
      }

      /*
       * Keep parent callback compatibility.
       */
      onDelete?.(id);

      if (!refreshed) {
        setSuccess(
          "Payment method deleted successfully, but the list could not be refreshed.",
        );

        return;
      }

      setSuccess("Payment method deleted successfully.");
    } catch (deleteError) {
      console.error("Delete payment method error:", deleteError);

      if (!mountedRef.current) {
        return;
      }

      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete payment method.",
      );
    } finally {
      if (mountedRef.current) {
        setDeletingId(null);
      }
    }
  };

  /* ==========================================================
     SORT
  ========================================================== */

  const sortedPaymentMethods = [...paymentMethods]
    .map(normalizePaymentMethod)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  /* ==========================================================
     INITIAL LOADING
  ========================================================== */

  if (initialLoading) {
    return (
      <div className="rounded-xl bg-white p-8 shadow">
        <div className="flex flex-col items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600" />

          <p className="mt-4 text-sm text-gray-500">
            Loading payment methods...
          </p>

          {error && (
            <div className="mt-4 max-w-lg rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
              {error}
            </div>
          )}
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
          <div className="flex items-start justify-between gap-4">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="shrink-0 text-red-500 hover:text-red-700"
              aria-label="Close error"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <div className="flex items-start justify-between gap-4">
            <span>{success}</span>

            <button
              type="button"
              onClick={() => setSuccess("")}
              className="shrink-0 text-green-500 hover:text-green-700"
              aria-label="Close success message"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* ======================================================
          MAIN CARD
      ======================================================= */}

      <div className="rounded-xl bg-white p-6 shadow">
        {/* HEADER */}

        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold">Payment Methods</h2>

              {refreshing && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600" />

                  <span>Refreshing...</span>
                </div>
              )}
            </div>

            <p className="text-sm text-gray-500">
              Manage deposit and withdraw payment methods.
            </p>
          </div>

          <Button
            variant="success"
            onClick={openAdd}
            disabled={
              saving || deletingId !== null || togglingId !== null || refreshing
            }
          >
            + Add Payment Method
          </Button>
        </div>

        {/* ====================================================
            TABLE
        ===================================================== */}

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
                          disabled={
                            isDeleting || isToggling || saving || refreshing
                          }
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
                            disabled={
                              isDeleting || isToggling || saving || refreshing
                            }
                            onClick={() => openEdit(method)}
                          >
                            Edit
                          </Button>

                          {/* DELETE */}

                          <Button
                            variant="danger"
                            disabled={
                              isDeleting || isToggling || saving || refreshing
                            }
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
