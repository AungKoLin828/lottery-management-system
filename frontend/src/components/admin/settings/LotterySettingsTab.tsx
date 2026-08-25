import { useCallback, useEffect, useMemo, useState } from "react";

import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Modal from "@/components/common/Modal";

import LotteryNumberSettings from "@/components/admin/settings/LotteryNumberSettings";
import DrawSettings from "@/components/admin/settings/DrawSettings";
import NumberRestrictions from "@/components/admin/settings/NumberRestrictions";

/* ============================================================
   TYPES
============================================================ */

type Holiday = {
  id: string;
  date: string;
  name: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type HolidayForm = {
  date: string;
  name: string;
};

type ApiResponse<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
};

type HolidaysData = {
  holidays: Holiday[];
};

/* ============================================================
   COMPONENT
============================================================ */

export default function LotterySettingsTab() {
  /* ==========================================================
     HOLIDAYS
  ========================================================== */

  const [holidays, setHolidays] = useState<Holiday[]>([]);

  const [loadingHolidays, setLoadingHolidays] = useState(true);

  const [savingHoliday, setSavingHoliday] = useState(false);

  const [deletingHolidayId, setDeletingHolidayId] = useState<string | null>(
    null,
  );

  const [holidayError, setHolidayError] = useState("");

  /* ==========================================================
     HOLIDAY MODAL
  ========================================================== */

  const [showHolidayModal, setShowHolidayModal] = useState(false);

  const [editingHolidayId, setEditingHolidayId] = useState<string | null>(null);

  const [holidayForm, setHolidayForm] = useState<HolidayForm>({
    date: "",
    name: "",
  });

  /* ==========================================================
     FILTER
  ========================================================== */

  const currentYear = new Date().getFullYear().toString();

  const [holidayYear, setHolidayYear] = useState(currentYear);

  const [holidaySearch, setHolidaySearch] = useState("");

  /* ==========================================================
     LOAD HOLIDAYS
  ========================================================== */

  const loadHolidays = useCallback(async () => {
    setLoadingHolidays(true);
    setHolidayError("");

    try {
      const response = await fetch("/api/admin/holidays", {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.toLowerCase().includes("application/json")) {
        const text = await response.text();

        console.error("Holiday API returned non-JSON:", text.slice(0, 1000));

        throw new Error(
          `API returned ${response.status} ${response.statusText} instead of JSON.`,
        );
      }

      const result = (await response.json()) as ApiResponse<HolidaysData>;

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load public holidays.");
      }

      const loadedHolidays = Array.isArray(result.data?.holidays)
        ? result.data.holidays
        : [];

      setHolidays(loadedHolidays);

      /*
       * Automatically select the first year available
       * in the database.
       */

      if (loadedHolidays.length > 0) {
        const years = Array.from(
          new Set(
            loadedHolidays
              .map((holiday) => holiday.date.substring(0, 4))
              .filter(Boolean),
          ),
        ).sort((a, b) => Number(b) - Number(a));

        if (years.length > 0 && !years.includes(holidayYear)) {
          setHolidayYear(years[0]);
        }
      }
    } catch (error) {
      console.error("Load holidays error:", error);

      setHolidays([]);

      setHolidayError(
        error instanceof Error
          ? error.message
          : "Failed to load public holidays.",
      );
    } finally {
      setLoadingHolidays(false);
    }
  }, [holidayYear]);

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    void loadHolidays();
  }, [loadHolidays]);

  /* ==========================================================
     AVAILABLE YEARS
  ========================================================== */

  const availableHolidayYears = useMemo(() => {
    const years = new Set<string>();

    holidays.forEach((holiday) => {
      if (holiday.date.length >= 4) {
        years.add(holiday.date.substring(0, 4));
      }
    });

    /*
     * Always show the current year so admin can
     * immediately register a holiday.
     */

    years.add(currentYear);

    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [holidays, currentYear]);

  /* ==========================================================
     FILTERED HOLIDAYS
  ========================================================== */

  const filteredHolidays = useMemo(() => {
    const search = holidaySearch.trim().toLowerCase();

    return [...holidays]
      .filter((holiday) => holiday.date.startsWith(`${holidayYear}-`))
      .filter((holiday) => {
        if (!search) {
          return true;
        }

        return holiday.name.toLowerCase().includes(search);
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [holidays, holidayYear, holidaySearch]);

  /* ==========================================================
     OPEN ADD
  ========================================================== */

  const openAddHoliday = () => {
    setHolidayError("");

    setEditingHolidayId(null);

    setHolidayForm({
      date: `${holidayYear}-01-01`,
      name: "",
    });

    setShowHolidayModal(true);
  };

  /* ==========================================================
     OPEN EDIT
  ========================================================== */

  const openEditHoliday = (holiday: Holiday) => {
    setHolidayError("");

    setEditingHolidayId(holiday.id);

    setHolidayForm({
      date: holiday.date,
      name: holiday.name,
    });

    setShowHolidayModal(true);
  };

  /* ==========================================================
     CLOSE MODAL
  ========================================================== */

  const closeHolidayModal = () => {
    if (savingHoliday) {
      return;
    }

    setShowHolidayModal(false);

    setEditingHolidayId(null);

    setHolidayForm({
      date: "",
      name: "",
    });

    setHolidayError("");
  };

  /* ==========================================================
     SAVE HOLIDAY
  ========================================================== */

  const saveHoliday = async () => {
    setHolidayError("");

    const date = holidayForm.date.trim();

    const name = holidayForm.name.trim();

    if (!date) {
      setHolidayError("Holiday date is required.");
      return;
    }

    if (!name) {
      setHolidayError("Holiday name is required.");
      return;
    }

    const parsedDate = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
      setHolidayError("Please enter a valid holiday date.");
      return;
    }

    setSavingHoliday(true);

    try {
      const isEditing = editingHolidayId !== null;

      const url = isEditing
        ? `/api/admin/holidays/${encodeURIComponent(editingHolidayId)}`
        : "/api/admin/holidays";

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          date,
          name,
          isActive: true,
        }),
      });

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.toLowerCase().includes("application/json")) {
        const text = await response.text();

        console.error(
          "Save holiday API returned non-JSON:",
          text.slice(0, 1000),
        );

        throw new Error(
          `API returned ${response.status} ${response.statusText} instead of JSON.`,
        );
      }

      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to save holiday.");
      }

      alert(
        isEditing
          ? "Holiday updated successfully."
          : "Holiday added successfully.",
      );

      setHolidayYear(date.substring(0, 4));

      closeHolidayModal();

      await loadHolidays();
    } catch (error) {
      console.error("Save holiday error:", error);

      setHolidayError(
        error instanceof Error ? error.message : "Failed to save holiday.",
      );
    } finally {
      setSavingHoliday(false);
    }
  };

  /* ==========================================================
     DELETE HOLIDAY
  ========================================================== */

  const deleteHoliday = async (holiday: Holiday) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${holiday.name}" on ${holiday.date}?`,
    );

    if (!confirmed) {
      return;
    }

    setHolidayError("");

    setDeletingHolidayId(holiday.id);

    try {
      const response = await fetch(
        `/api/admin/holidays/${encodeURIComponent(holiday.id)}`,
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
          "Delete holiday API returned non-JSON:",
          text.slice(0, 1000),
        );

        throw new Error(
          `API returned ${response.status} ${response.statusText} instead of JSON.`,
        );
      }

      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to delete holiday.");
      }

      alert("Holiday deleted successfully.");

      await loadHolidays();
    } catch (error) {
      console.error("Delete holiday error:", error);

      setHolidayError(
        error instanceof Error ? error.message : "Failed to delete holiday.",
      );
    } finally {
      setDeletingHolidayId(null);
    }
  };

  /* ==========================================================
     TOGGLE ACTIVE
  ========================================================== */

  const toggleHolidayStatus = async (holiday: Holiday) => {
    setHolidayError("");

    try {
      const response = await fetch(
        `/api/admin/holidays/${encodeURIComponent(holiday.id)}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            isActive: !holiday.isActive,
          }),
        },
      );

      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update holiday status.");
      }

      await loadHolidays();
    } catch (error) {
      console.error("Toggle holiday error:", error);

      setHolidayError(
        error instanceof Error
          ? error.message
          : "Failed to update holiday status.",
      );
    }
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="space-y-6">
      {/* ======================================================
          LOTTERY NUMBER CONTROL
      ====================================================== */}

      <div className="rounded-xl bg-white p-6 shadow">
        <h2 className="mb-6 text-xl font-bold">Lottery Number Control</h2>

        <section className="mb-6 rounded-lg border p-5">
          <h3 className="mb-4 text-lg font-semibold">
            Lottery Number Settings
          </h3>

          <LotteryNumberSettings />
        </section>

        <section className="mb-6 rounded-lg border p-5">
          <h3 className="mb-4 text-lg font-semibold">Draw Control</h3>

          <DrawSettings />
        </section>

        <section className="rounded-lg border p-5">
          <h3 className="mb-4 text-lg font-semibold">Number Restrictions</h3>

          <NumberRestrictions />
        </section>
      </div>

      {/* ======================================================
          PUBLIC HOLIDAYS
      ====================================================== */}

      <div className="rounded-xl bg-white p-6 shadow">
        {/* HEADER */}

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              2D Public Holiday Management
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Register and manage public holidays stored in the database. Active
              holidays prevent 2D AM and PM draws.
            </p>
          </div>

          <Button variant="success" onClick={openAddHoliday}>
            + Add Holiday
          </Button>
        </div>

        {/* INFORMATION */}

        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex gap-3">
            <div className="mt-0.5 text-blue-600">ⓘ</div>

            <div>
              <p className="font-medium text-blue-800">2D Draw Off Days</p>

              <p className="mt-1 text-sm text-blue-700">
                Holidays registered here are stored in PostgreSQL. When a
                holiday is active, both 2D AM and PM sessions can be blocked for
                that date. 3D scheduling remains independent.
              </p>
            </div>
          </div>
        </div>

        {/* ERROR */}

        {holidayError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {holidayError}
          </div>
        )}

        {/* FILTERS */}

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-[180px_1fr_auto]">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Year
            </label>

            <select
              className="w-full rounded-lg border p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={holidayYear}
              onChange={(e) => setHolidayYear(e.target.value)}
            >
              {availableHolidayYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Search Holiday
            </label>

            <input
              type="text"
              value={holidaySearch}
              onChange={(e) => setHolidaySearch(e.target.value)}
              placeholder="Search holiday name..."
              className="w-full rounded-lg border p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <div className="rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700">
              {filteredHolidays.length} Holiday
              {filteredHolidays.length === 1 ? "" : "s"}
            </div>
          </div>
        </div>

        {/* TABLE */}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 font-semibold text-gray-700">#</th>

                <th className="px-4 py-3 font-semibold text-gray-700">Date</th>

                <th className="px-4 py-3 font-semibold text-gray-700">Day</th>

                <th className="px-4 py-3 font-semibold text-gray-700">
                  Holiday
                </th>

                <th className="px-4 py-3 text-center font-semibold text-gray-700">
                  Status
                </th>

                <th className="px-4 py-3 text-right font-semibold text-gray-700">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loadingHolidays ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-gray-500"
                  >
                    Loading holidays...
                  </td>
                </tr>
              ) : filteredHolidays.length > 0 ? (
                filteredHolidays.map((holiday, index) => {
                  const date = new Date(`${holiday.date}T00:00:00`);

                  const dayName = date.toLocaleDateString("en-US", {
                    weekday: "long",
                  });

                  const deleting = deletingHolidayId === holiday.id;

                  return (
                    <tr
                      key={holiday.id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="px-4 py-4 text-gray-500">{index + 1}</td>

                      <td className="px-4 py-4">
                        <span className="rounded-md bg-gray-100 px-2.5 py-1 font-mono text-sm text-gray-700">
                          {holiday.date}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-gray-600">{dayName}</td>

                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">
                          {holiday.name}
                        </div>

                        <div className="mt-1 text-xs text-red-600">
                          2D AM / PM Draw Off
                        </div>
                      </td>

                      <td className="px-4 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => void toggleHolidayStatus(holiday)}
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            holiday.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {holiday.isActive ? "Active" : "Inactive"}
                        </button>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => openEditHoliday(holiday)}
                          >
                            Edit
                          </Button>

                          <Button
                            variant="danger"
                            onClick={() => void deleteHoliday(holiday)}
                            disabled={deleting}
                          >
                            {deleting ? "Deleting..." : "Delete"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-gray-500"
                  >
                    <div className="text-base font-medium">
                      No holidays found
                    </div>

                    <p className="mt-1 text-sm">
                      No holidays are registered in the database for{" "}
                      {holidayYear}.
                    </p>

                    <div className="mt-4">
                      <Button variant="success" onClick={openAddHoliday}>
                        + Register Holiday
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}

        <div className="mt-6 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">
            Total database holidays:{" "}
            <span className="font-semibold text-gray-700">
              {holidays.length}
            </span>
          </p>

          <button
            type="button"
            onClick={() => void loadHolidays()}
            disabled={loadingHolidays}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
          >
            {loadingHolidays ? "Refreshing..." : "Refresh Holidays"}
          </button>
        </div>
      </div>

      {/* ======================================================
          ADD / EDIT HOLIDAY MODAL
      ====================================================== */}

      <Modal
        open={showHolidayModal}
        title={
          editingHolidayId !== null
            ? "Edit Public Holiday"
            : "Register Public Holiday"
        }
        onClose={closeHolidayModal}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();

            void saveHoliday();
          }}
          className="space-y-5"
        >
          {/* ERROR */}

          {holidayError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {holidayError}
            </div>
          )}

          {/* DATE */}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Holiday Date
            </label>

            <input
              type="date"
              value={holidayForm.date}
              onChange={(e) =>
                setHolidayForm((prev) => ({
                  ...prev,
                  date: e.target.value,
                }))
              }
              className="w-full rounded-lg border p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          {/* NAME */}

          <Input
            label="Holiday Name"
            value={holidayForm.name}
            onChange={(e) =>
              setHolidayForm((prev) => ({
                ...prev,
                name: e.target.value,
              }))
            }
            placeholder="e.g. Independence Day"
            required
          />

          {/* INFORMATION */}

          <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
            <strong>Important:</strong> An active holiday will be treated as a
            2D draw off day. Both AM and PM sessions can be blocked for this
            date.
          </div>

          {/* ACTIONS */}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeHolidayModal}
              disabled={savingHoliday}
            >
              Cancel
            </Button>

            <Button type="submit" variant="success" disabled={savingHoliday}>
              {savingHoliday
                ? "Saving..."
                : editingHolidayId !== null
                  ? "Update Holiday"
                  : "Register Holiday"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
