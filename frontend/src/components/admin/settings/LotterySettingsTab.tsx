import { useMemo, useState } from "react";

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
  date: string;
  name: string;
};

/* ============================================================
   DEFAULT HOLIDAYS
============================================================ */

const defaultTwoDOffDays: Record<string, string> = {
  "2026-01-01": "New Year's Day",
  "2026-01-02": "New Year Holiday",
  "2026-01-04": "Independence Day",

  "2026-02-12": "Union Day",
  "2026-02-13": "Union Day Holiday",
  "2026-02-16": "Chinese New Year",
  "2026-02-17": "Chinese New Year Holiday",

  "2026-03-27": "Armed Forces Day",

  "2026-05-01": "Labour Day",
  "2026-05-28": "Eid Al-Adha",

  "2026-07-19": "Martyrs' Day",

  "2026-12-04": "National Day",
  "2026-12-25": "Christmas Day",
};

const defaultHolidays: Holiday[] = Object.entries(defaultTwoDOffDays)
  .map(([date, name]) => ({
    date,
    name,
  }))
  .sort((a, b) => a.date.localeCompare(b.date));

/* ============================================================
   COMPONENT
============================================================ */

export default function LotterySettingsTab() {
  const [holidays, setHolidays] = useState<Holiday[]>(defaultHolidays);

  const [showHolidayModal, setShowHolidayModal] = useState(false);

  const [editingHolidayDate, setEditingHolidayDate] = useState<string | null>(
    null,
  );

  const [holidayForm, setHolidayForm] = useState<Holiday>({
    date: "",
    name: "",
  });

  const [holidayYear, setHolidayYear] = useState("2026");

  const [holidaySearch, setHolidaySearch] = useState("");

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

    years.add(new Date().getFullYear().toString());

    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [holidays]);

  /* ==========================================================
     FILTER
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
     ADD HOLIDAY
  ========================================================== */

  const openAddHoliday = () => {
    setHolidayForm({
      date: `${holidayYear}-01-01`,
      name: "",
    });

    setEditingHolidayDate(null);
    setShowHolidayModal(true);
  };

  /* ==========================================================
     EDIT HOLIDAY
  ========================================================== */

  const openEditHoliday = (holiday: Holiday) => {
    setHolidayForm({
      date: holiday.date,
      name: holiday.name,
    });

    setEditingHolidayDate(holiday.date);

    setShowHolidayModal(true);
  };

  /* ==========================================================
     SAVE HOLIDAY
  ========================================================== */

  const saveHoliday = () => {
    const date = holidayForm.date.trim();

    const name = holidayForm.name.trim();

    if (!date) {
      alert("Holiday date is required.");
      return;
    }

    if (!name) {
      alert("Holiday name is required.");
      return;
    }

    const parsedDate = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
      alert("Please enter a valid holiday date.");
      return;
    }

    const duplicate = holidays.some(
      (holiday) => holiday.date === date && holiday.date !== editingHolidayDate,
    );

    if (duplicate) {
      alert("A holiday already exists for this date.");
      return;
    }

    if (editingHolidayDate !== null) {
      setHolidays((prev) =>
        prev.map((holiday) =>
          holiday.date === editingHolidayDate
            ? {
                date,
                name,
              }
            : holiday,
        ),
      );

      alert("Holiday updated successfully.");
    } else {
      setHolidays((prev) => [
        ...prev,
        {
          date,
          name,
        },
      ]);

      setHolidayYear(date.substring(0, 4));

      alert("Holiday added successfully.");
    }

    setShowHolidayModal(false);
    setEditingHolidayDate(null);

    setHolidayForm({
      date: "",
      name: "",
    });
  };

  /* ==========================================================
     DELETE
  ========================================================== */

  const deleteHoliday = (holiday: Holiday) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${holiday.name}" on ${holiday.date}?`,
    );

    if (!confirmed) {
      return;
    }

    setHolidays((prev) => prev.filter((item) => item.date !== holiday.date));

    alert("Holiday deleted successfully.");
  };

  /* ==========================================================
     SAVE HOLIDAYS
  ========================================================== */

  const saveHolidaySettings = () => {
    const twoDOffDays: Record<string, string> = {};

    [...holidays]
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach((holiday) => {
        twoDOffDays[holiday.date] = holiday.name;
      });

    console.log("2D Public Holidays:", twoDOffDays);

    alert("2D public holidays saved successfully.");
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
          HOLIDAY MANAGEMENT
      ====================================================== */}

      <div className="rounded-xl bg-white p-6 shadow">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              2D Public Holiday Management
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Manage public holidays and off days when 2D draws should not be
              available.
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
                Dates configured here can be used by the 2D draw schedule to
                prevent AM and PM draws on public holidays.
              </p>
            </div>
          </div>
        </div>

        {/* FILTERS */}

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-[180px_1fr_auto]">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Year
            </label>

            <select
              className="w-full rounded-lg border p-2.5"
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
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 font-semibold text-gray-700">#</th>

                <th className="px-4 py-3 font-semibold text-gray-700">Date</th>

                <th className="px-4 py-3 font-semibold text-gray-700">Day</th>

                <th className="px-4 py-3 font-semibold text-gray-700">
                  Holiday
                </th>

                <th className="px-4 py-3 text-right font-semibold text-gray-700">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {filteredHolidays.map((holiday, index) => {
                const date = new Date(`${holiday.date}T00:00:00`);

                const dayName = date.toLocaleDateString("en-US", {
                  weekday: "long",
                });

                return (
                  <tr
                    key={holiday.date}
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
                          onClick={() => deleteHoliday(holiday)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredHolidays.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-gray-500"
                  >
                    <div className="text-base font-medium">
                      No holidays found
                    </div>

                    <p className="mt-1 text-sm">
                      Add a new public holiday or change the selected
                      year/search.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* SAVE */}

        <div className="mt-6 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">
            Total configured holidays:{" "}
            <span className="font-semibold text-gray-700">
              {holidays.length}
            </span>
          </p>

          <Button variant="success" onClick={saveHolidaySettings}>
            Save Public Holidays
          </Button>
        </div>
      </div>

      {/* ======================================================
          HOLIDAY MODAL
      ====================================================== */}

      <Modal
        open={showHolidayModal}
        title={
          editingHolidayDate !== null
            ? "Edit Public Holiday"
            : "Add Public Holiday"
        }
        onClose={() => {
          setShowHolidayModal(false);
          setEditingHolidayDate(null);
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveHoliday();
          }}
          className="space-y-5"
        >
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

          <Input
            label="Holiday Name"
            value={holidayForm.name}
            onChange={(e) =>
              setHolidayForm((prev) => ({
                ...prev,
                name: e.target.value,
              }))
            }
            placeholder="e.g. New Year's Day"
            required
          />

          <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
            <strong>Important:</strong> This date will be treated as a 2D draw
            off day. Both AM and PM sessions can be blocked for this date.
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowHolidayModal(false);
                setEditingHolidayDate(null);
              }}
            >
              Cancel
            </Button>

            <Button type="submit" variant="success">
              {editingHolidayDate !== null ? "Update Holiday" : "Add Holiday"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
