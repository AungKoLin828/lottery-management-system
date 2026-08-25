import { useCallback, useEffect, useState } from "react";

import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Select from "@/components/common/Select";

/* ============================================================
   TYPES
============================================================ */

type LotteryType = "2D" | "3D";

interface BlockedNumber {
  id: string;
  number: string;
  type: LotteryType;
  reason: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

interface RestrictionsData {
  restrictions: BlockedNumber[];
}

interface RestrictionResponse {
  restriction?: BlockedNumber;
}

/* ============================================================
   API
============================================================ */

const RESTRICTIONS_API = "/api/admin/number-restrictions";

/* ============================================================
   COMPONENT
============================================================ */

export default function NumberRestrictions() {
  /* ==========================================================
     FORM
  ========================================================== */

  const [number, setNumber] = useState("");

  const [lotteryType, setLotteryType] = useState<LotteryType>("2D");

  const [reason, setReason] = useState("");

  /* ==========================================================
     DATA
  ========================================================== */

  const [blockedNumbers, setBlockedNumbers] = useState<BlockedNumber[]>([]);

  /* ==========================================================
     LOADING
  ========================================================== */

  const [loading, setLoading] = useState(true);

  const [blocking, setBlocking] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [updatingId, setUpdatingId] = useState<string | null>(null);

  /* ==========================================================
     ERROR
  ========================================================== */

  const [error, setError] = useState("");

  /* ==========================================================
     API RESPONSE HELPER
  ========================================================== */

  const readApiResponse = async <T,>(
    response: Response,
  ): Promise<ApiResponse<T>> => {
    const contentType = response.headers.get("content-type") || "";

    if (!contentType.toLowerCase().includes("application/json")) {
      const text = await response.text();

      console.error(
        "Number restrictions API returned non-JSON:",
        text.slice(0, 2000),
      );

      throw new Error(
        `API returned ${response.status} ${
          response.statusText || ""
        } instead of JSON.`,
      );
    }

    try {
      return (await response.json()) as ApiResponse<T>;
    } catch (parseError) {
      console.error(
        "Failed to parse number restrictions API response:",
        parseError,
      );

      throw new Error("The server returned invalid JSON.");
    }
  };

  /* ==========================================================
     LOAD
  ========================================================== */

  const loadRestrictions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(RESTRICTIONS_API, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      const result = await readApiResponse<RestrictionsData>(response);

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to load number restrictions.",
        );
      }

      const restrictions = Array.isArray(result.data?.restrictions)
        ? result.data.restrictions
        : [];

      setBlockedNumbers(restrictions);
    } catch (loadError) {
      console.error("Load number restrictions error:", loadError);

      setBlockedNumbers([]);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load number restrictions.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    void loadRestrictions();
  }, [loadRestrictions]);

  /* ==========================================================
     BLOCK NUMBER
  ========================================================== */

  const handleBlock = async () => {
    setError("");

    const cleanNumber = number.trim();

    const cleanReason = reason.trim() || "Admin restriction";

    const expectedLength = lotteryType === "2D" ? 2 : 3;

    /* --------------------------------------------------------
       VALIDATION
    -------------------------------------------------------- */

    if (!cleanNumber) {
      setError("Please enter a number.");
      return;
    }

    if (!/^\d+$/.test(cleanNumber)) {
      setError("Only numbers are allowed.");
      return;
    }

    if (cleanNumber.length !== expectedLength) {
      setError(`${lotteryType} number must contain ${expectedLength} digits.`);
      return;
    }

    if (cleanReason.length > 255) {
      setError("Reason must not exceed 255 characters.");
      return;
    }

    setBlocking(true);

    try {
      const response = await fetch(RESTRICTIONS_API, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          number: cleanNumber,
          type: lotteryType,
          reason: cleanReason,
          isActive: true,
        }),
      });

      const result = await readApiResponse<RestrictionResponse>(response);

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to block number.");
      }

      /* ------------------------------------------------------
         UPDATE LOCAL STATE
      ------------------------------------------------------ */

      if (result.data?.restriction) {
        setBlockedNumbers((previous) =>
          [...previous, result.data!.restriction!].sort((a, b) => {
            if (a.type !== b.type) {
              return a.type.localeCompare(b.type);
            }

            return a.number.localeCompare(b.number);
          }),
        );
      } else {
        await loadRestrictions();
      }

      setNumber("");
      setReason("");

      alert(`${lotteryType} number ${cleanNumber} blocked successfully.`);
    } catch (blockError) {
      console.error("Block number error:", blockError);

      setError(
        blockError instanceof Error
          ? blockError.message
          : "Failed to block number.",
      );
    } finally {
      setBlocking(false);
    }
  };

  /* ==========================================================
     UNBLOCK
  ========================================================== */

  const handleUnblock = async (item: BlockedNumber) => {
    const confirmed = window.confirm(
      `Are you sure you want to unblock ${item.number} (${item.type})?`,
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setDeletingId(item.id);

    try {
      const response = await fetch(
        `${RESTRICTIONS_API}/${encodeURIComponent(item.id)}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        },
      );

      const result = await readApiResponse(response);

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to unblock number.");
      }

      setBlockedNumbers((previous) =>
        previous.filter((restriction) => restriction.id !== item.id),
      );

      alert(`${item.type} number ${item.number} unblocked successfully.`);
    } catch (unblockError) {
      console.error("Unblock number error:", unblockError);

      setError(
        unblockError instanceof Error
          ? unblockError.message
          : "Failed to unblock number.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  /* ==========================================================
     TOGGLE ACTIVE
  ========================================================== */

  const handleToggleStatus = async (item: BlockedNumber) => {
    setError("");
    setUpdatingId(item.id);

    try {
      const response = await fetch(
        `${RESTRICTIONS_API}/${encodeURIComponent(item.id)}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            isActive: !item.isActive,
          }),
        },
      );

      const result = await readApiResponse<RestrictionResponse>(response);

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update restriction.");
      }

      setBlockedNumbers((previous) =>
        previous.map((restriction) =>
          restriction.id === item.id
            ? {
                ...restriction,
                isActive:
                  result.data?.restriction?.isActive ?? !restriction.isActive,
              }
            : restriction,
        ),
      );
    } catch (toggleError) {
      console.error("Toggle restriction error:", toggleError);

      setError(
        toggleError instanceof Error
          ? toggleError.message
          : "Failed to update restriction.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="space-y-6">
      {/* ======================================================
          BLOCK NUMBER
      ====================================================== */}

      <div className="rounded-xl bg-white p-5 shadow">
        <h2 className="mb-1 text-xl font-bold">Number Restrictions</h2>

        <p className="mb-5 text-sm text-gray-500">
          Block specific 2D or 3D numbers from ticket purchases.
        </p>

        {/* ERROR */}

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="font-semibold">
              Number restriction operation failed
            </div>

            <div className="mt-1">{error}</div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* LOTTERY TYPE */}

          <Select
            label="Lottery Type"
            value={lotteryType}
            onChange={(event) => {
              const type = event.target.value as LotteryType;

              setLotteryType(type);
              setNumber("");
              setError("");
            }}
            options={[
              {
                label: "2D",
                value: "2D",
              },
              {
                label: "3D",
                value: "3D",
              },
            ]}
          />

          {/* NUMBER */}

          <Input
            label={lotteryType === "2D" ? "2D Number" : "3D Number"}
            value={number}
            maxLength={lotteryType === "2D" ? 2 : 3}
            onChange={(event) =>
              setNumber(
                event.target.value
                  .replace(/\D/g, "")
                  .slice(0, lotteryType === "2D" ? 2 : 3),
              )
            }
            placeholder={lotteryType === "2D" ? "00" : "000"}
            disabled={blocking}
          />

          {/* REASON */}

          <Input
            label="Reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Admin restriction"
            disabled={blocking}
          />
        </div>

        <div className="mt-5 flex justify-end">
          <Button
            variant="success"
            onClick={() => void handleBlock()}
            disabled={blocking || loading}
          >
            {blocking ? "Blocking..." : "Block Number"}
          </Button>
        </div>
      </div>

      {/* ======================================================
          BLOCKED NUMBERS
      ====================================================== */}

      <div className="rounded-xl bg-white p-5 shadow">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Blocked Numbers</h2>

            <p className="text-sm text-gray-500">
              Currently restricted lottery numbers from PostgreSQL.
            </p>
          </div>

          <span className="rounded-full bg-red-100 px-3 py-1 text-sm text-red-700">
            {blockedNumbers.filter((item) => item.isActive).length} Active
          </span>
        </div>

        {/* TABLE */}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b bg-gray-100">
                <th className="p-3 text-left">Number</th>

                <th className="p-3 text-left">Type</th>

                <th className="p-3 text-left">Reason</th>

                <th className="p-3 text-center">Status</th>

                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    <div className="font-medium">
                      Loading blocked numbers...
                    </div>

                    <div className="mt-1 text-xs text-gray-400">
                      Loading from PostgreSQL
                    </div>
                  </td>
                </tr>
              ) : blockedNumbers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    <div className="font-medium">No blocked numbers.</div>

                    <div className="mt-1 text-sm text-gray-400">
                      No number restrictions are currently stored in the
                      database.
                    </div>
                  </td>
                </tr>
              ) : (
                blockedNumbers.map((item) => {
                  const deleting = deletingId === item.id;

                  const updating = updatingId === item.id;

                  return (
                    <tr
                      key={item.id}
                      className="border-b transition hover:bg-gray-50"
                    >
                      {/* NUMBER */}

                      <td className="p-3">
                        <span className="font-mono text-lg font-bold">
                          {item.number}
                        </span>
                      </td>

                      {/* TYPE */}

                      <td className="p-3">
                        <span
                          className={`rounded px-2 py-1 text-xs font-semibold ${
                            item.type === "2D"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {item.type}
                        </span>
                      </td>

                      {/* REASON */}

                      <td className="p-3">{item.reason}</td>

                      {/* STATUS */}

                      <td className="p-3 text-center">
                        <button
                          type="button"
                          disabled={updating || deleting}
                          onClick={() => void handleToggleStatus(item)}
                          className={`rounded-full px-3 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                            item.isActive
                              ? "bg-red-100 text-red-700 hover:bg-red-200"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {updating
                            ? "Updating..."
                            : item.isActive
                              ? "Blocked"
                              : "Inactive"}
                        </button>
                      </td>

                      {/* ACTION */}

                      <td className="p-3 text-center">
                        <Button
                          variant="outline"
                          onClick={() => void handleUnblock(item)}
                          disabled={deleting || updating}
                        >
                          {deleting ? "Removing..." : "Unblock"}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}

        <div className="mt-5 flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">
            Total database restrictions:{" "}
            <span className="font-semibold text-gray-700">
              {blockedNumbers.length}
            </span>
          </p>

          <button
            type="button"
            onClick={() => void loadRestrictions()}
            disabled={loading}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh Restrictions"}
          </button>
        </div>
      </div>
    </div>
  );
}
