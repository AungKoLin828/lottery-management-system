// src/pages/admin/ResultManagement.tsx

import { useCallback, useEffect, useState } from "react";

import { initialResult } from "@/types/result";
import type { Result } from "@/types/result";

import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Select from "@/components/common/Select";
import Modal from "@/components/common/Modal";

interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

interface ResultsData {
  results: Result[];
}

export default function ResultManagement() {
  /* ============================================================
     STATE
  ============================================================ */

  const [openModal, setOpenModal] = useState(false);

  const [openEditModal, setOpenEditModal] = useState(false);

  const [editing, setEditing] = useState<Result | null>(null);

  const [result, setResult] = useState<Result>(initialResult);

  const [results, setResults] = useState<Result[]>([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  /* ============================================================
     LOAD RESULTS
  ============================================================ */

  const loadResults = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/results", {
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

      const data = (await response.json()) as ApiResponse<ResultsData>;

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load lottery results.");
      }

      setResults(data.data?.results ?? []);
    } catch (error) {
      console.error("Load results error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load lottery results.",
      );

      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ============================================================
     INITIAL LOAD
  ============================================================ */

  useEffect(() => {
    void loadResults();
  }, [loadResults]);

  /* ============================================================
     FORM CHANGE
  ============================================================ */

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    setResult((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* ============================================================
     EDIT FORM CHANGE
  ============================================================ */

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    if (!editing) {
      return;
    }

    const { name, value } = e.target;

    setEditing((prev) => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        [name]: value,
      };
    });
  };

  /* ============================================================
     OPEN CREATE
  ============================================================ */

  const openCreate = () => {
    setError("");

    setResult({
      ...initialResult,
      drawDate: "",
      drawType: "2D",
      session: "AM",
      winningNumber: "",
      status: "Draft",
      createdBy: "admin",
    });

    setOpenModal(true);
  };

  /* ============================================================
     CREATE RESULT
  ============================================================ */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");

    if (!result.drawDate) {
      setError("Draw date is required.");
      return;
    }

    if (!result.winningNumber.trim()) {
      setError("Winning number is required.");
      return;
    }

    const winningNumber = result.winningNumber.trim();

    if (result.drawType === "2D") {
      if (!/^\d{2}$/.test(winningNumber)) {
        setError("2D winning number must contain exactly 2 digits.");
        return;
      }
    }

    if (result.drawType === "3D") {
      if (!/^\d{3}$/.test(winningNumber)) {
        setError("3D winning number must contain exactly 3 digits.");
        return;
      }
    }

    setSaving(true);

    try {
      const response = await fetch("/api/admin/results", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          drawDate: result.drawDate,
          drawType: result.drawType,
          session: result.drawType === "3D" ? null : result.session,
          winningNumber,
          status: result.status,
          note: result.note ?? "",
        }),
      });

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        const text = await response.text();

        console.error("Create result API returned:", text.slice(0, 500));

        throw new Error(
          `API returned ${response.status} ${response.statusText} instead of JSON.`,
        );
      }

      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to create lottery result.");
      }

      setResult(initialResult);

      setOpenModal(false);

      await loadResults();
    } catch (error) {
      console.error("Create result error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to create lottery result.",
      );
    } finally {
      setSaving(false);
    }
  };

  /* ============================================================
     DELETE RESULT
  ============================================================ */

  const handleDelete = async (id: string | number) => {
    const confirmed = window.confirm("Delete this lottery result?");

    if (!confirmed) {
      return;
    }

    setError("");

    try {
      setSaving(true);

      const response = await fetch(
        `/api/admin/results/${encodeURIComponent(String(id))}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        },
      );

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        const text = await response.text();

        console.error("Delete result API returned:", text.slice(0, 500));

        throw new Error(
          `API returned ${response.status} ${response.statusText} instead of JSON.`,
        );
      }

      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete lottery result.");
      }

      await loadResults();
    } catch (error) {
      console.error("Delete result error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete lottery result.",
      );
    } finally {
      setSaving(false);
    }
  };

  /* ============================================================
     OPEN EDIT
  ============================================================ */

  const handleEdit = (item: Result) => {
    setError("");

    setEditing({
      ...item,
    });

    setOpenEditModal(true);
  };

  /* ============================================================
     UPDATE RESULT
  ============================================================ */

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editing) {
      return;
    }

    setError("");

    if (!editing.drawDate) {
      setError("Draw date is required.");
      return;
    }

    if (!editing.winningNumber.trim()) {
      setError("Winning number is required.");
      return;
    }

    const winningNumber = editing.winningNumber.trim();

    if (editing.drawType === "2D") {
      if (!/^\d{2}$/.test(winningNumber)) {
        setError("2D winning number must contain exactly 2 digits.");
        return;
      }
    }

    if (editing.drawType === "3D") {
      if (!/^\d{3}$/.test(winningNumber)) {
        setError("3D winning number must contain exactly 3 digits.");
        return;
      }
    }

    setSaving(true);

    try {
      const response = await fetch(
        `/api/admin/results/${encodeURIComponent(String(editing.id))}`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            drawDate: editing.drawDate,
            drawType: editing.drawType,
            session: editing.drawType === "3D" ? null : editing.session,
            winningNumber,
            status: editing.status,
            note: editing.note ?? "",
          }),
        },
      );

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        const text = await response.text();

        console.error("Update result API returned:", text.slice(0, 500));

        throw new Error(
          `API returned ${response.status} ${response.statusText} instead of JSON.`,
        );
      }

      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update lottery result.");
      }

      setOpenEditModal(false);

      setEditing(null);

      await loadResults();
    } catch (error) {
      console.error("Update result error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update lottery result.",
      );
    } finally {
      setSaving(false);
    }
  };

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="min-w-0">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Results Management
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage 2D and 3D lottery results.
          </p>
        </div>

        <Button type="button" variant="success" onClick={openCreate}>
          Add Result
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
          RESULT LIST
      ====================================================== */}

      <div className="overflow-hidden rounded-xl bg-white shadow">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b bg-gray-100 text-left text-sm text-gray-600">
                <th className="p-3">Date</th>

                <th className="p-3">Type</th>

                <th className="p-3">Session</th>

                <th className="p-3">Number</th>

                <th className="p-3">Status</th>

                <th className="p-3">Created By</th>

                <th className="p-3">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-gray-500">
                    Loading results...
                  </td>
                </tr>
              ) : results.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-gray-500">
                    No lottery results found.
                  </td>
                </tr>
              ) : (
                results.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b last:border-b-0 hover:bg-gray-50"
                  >
                    <td className="p-3">{item.drawDate}</td>

                    <td className="p-3">
                      <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        {item.drawType}
                      </span>
                    </td>

                    <td className="p-3">
                      {item.drawType === "3D" ? "-" : item.session || "-"}
                    </td>

                    <td className="p-3 font-bold">{item.winningNumber}</td>

                    <td className="p-3">
                      <span
                        className={
                          item.status === "Published"
                            ? "rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700"
                            : "rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700"
                        }
                      >
                        {item.status}
                      </span>
                    </td>

                    <td className="p-3">{item.createdBy || "-"}</td>

                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="primary"
                          disabled={saving}
                          onClick={() => handleEdit(item)}
                        >
                          Edit
                        </Button>

                        <Button
                          type="button"
                          variant="danger"
                          disabled={saving}
                          onClick={() => void handleDelete(item.id)}
                        >
                          Delete
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

      {/* ======================================================
          ADD RESULT MODAL
      ====================================================== */}

      <Modal
        open={openModal}
        title="Add Lottery Result"
        onClose={() => {
          if (!saving) {
            setOpenModal(false);
          }
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Draw Date"
            type="date"
            name="drawDate"
            value={result.drawDate}
            onChange={handleChange}
            disabled={saving}
            required
          />

          <Select
            label="Draw Type"
            name="drawType"
            value={result.drawType}
            onChange={handleChange}
            disabled={saving}
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

          {result.drawType === "2D" && (
            <Select
              label="Draw Session"
              name="session"
              value={result.session || "AM"}
              onChange={handleChange}
              disabled={saving}
              options={[
                {
                  label: "AM",
                  value: "AM",
                },
                {
                  label: "PM",
                  value: "PM",
                },
              ]}
            />
          )}

          <Input
            label="Winning Number"
            name="winningNumber"
            placeholder={result.drawType === "2D" ? "25" : "125"}
            value={result.winningNumber}
            onChange={handleChange}
            disabled={saving}
            inputMode="numeric"
            maxLength={result.drawType === "2D" ? 2 : 3}
            required
          />

          <Select
            label="Status"
            name="status"
            value={result.status}
            onChange={handleChange}
            disabled={saving}
            options={[
              {
                label: "Published",
                value: "Published",
              },
              {
                label: "Draft",
                value: "Draft",
              },
            ]}
          />

          <Input
            label="Created By"
            name="createdBy"
            value={result.createdBy || "admin"}
            disabled
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => setOpenModal(false)}
            >
              Cancel
            </Button>

            <Button type="submit" variant="success" disabled={saving}>
              {saving ? "Saving..." : "Save Result"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ======================================================
          EDIT RESULT MODAL
      ====================================================== */}

      <Modal
        open={openEditModal}
        title="Edit Result"
        onClose={() => {
          if (!saving) {
            setOpenEditModal(false);
            setEditing(null);
          }
        }}
      >
        {editing && (
          <form onSubmit={handleUpdate} className="space-y-4">
            <Input
              label="Draw Date"
              name="drawDate"
              type="date"
              value={editing.drawDate}
              onChange={handleEditChange}
              disabled={saving}
              required
            />

            <Select
              label="Draw Type"
              name="drawType"
              value={editing.drawType}
              onChange={handleEditChange}
              disabled={saving}
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

            {editing.drawType === "2D" && (
              <Select
                label="Session"
                name="session"
                value={editing.session || "AM"}
                onChange={handleEditChange}
                disabled={saving}
                options={[
                  {
                    label: "AM",
                    value: "AM",
                  },
                  {
                    label: "PM",
                    value: "PM",
                  },
                ]}
              />
            )}

            <Input
              label="Winning Number"
              name="winningNumber"
              value={editing.winningNumber}
              onChange={handleEditChange}
              disabled={saving}
              inputMode="numeric"
              maxLength={editing.drawType === "2D" ? 2 : 3}
              required
            />

            <Select
              label="Status"
              name="status"
              value={editing.status}
              onChange={handleEditChange}
              disabled={saving}
              options={[
                {
                  label: "Published",
                  value: "Published",
                },
                {
                  label: "Draft",
                  value: "Draft",
                },
              ]}
            />

            <Input
              label="Created By"
              name="createdBy"
              value={editing.createdBy || "admin"}
              disabled
            />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => {
                  setOpenEditModal(false);
                  setEditing(null);
                }}
              >
                Cancel
              </Button>

              <Button type="submit" variant="secondary" disabled={saving}>
                {saving ? "Updating..." : "Update"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
