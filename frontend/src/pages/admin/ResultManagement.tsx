import { useState } from "react";

import { initialResult } from "@/types/result";
import type { Result } from "@/types/result";

import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Select from "@/components/common/Select";
import Modal from "@/components/common/Modal";

export default function ResultManagement() {
  const [openModal, setOpenModal] = useState(false);

  const [openEditModal, setOpenEditModal] = useState(false);

  const [editing, setEditing] = useState<Result | null>(null);

  const [result, setResult] = useState<Result>(initialResult);
  // sample data
  const [results, setResults] = useState<Result[]>([
    {
      id: 1,
      drawDate: "2026-08-04",
      drawType: "2D",
      session: "AM",
      winningNumber: "25",
      status: "Published",
      createdBy: "admin",
    },
    {
      id: 2,
      drawDate: "2026-08-04",
      drawType: "2D",
      session: "PM",
      winningNumber: "61",
      status: "Published",
      createdBy: "admin",
    },
  ]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setResult((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newResult: Result = {
      ...result,
      id: Date.now(),
    };

    setResults((prev) => [...prev, newResult]);

    console.log(newResult);

    // TODO:
    // POST /.netlify/functions/results/create

    setResult(initialResult);

    setOpenModal(false);
  };

  const handleDelete = (id: number) => {
    if (!window.confirm("Delete this result?")) return;

    setResults(results.filter((r) => r.id !== id));
  };

  const handleEdit = (result: Result) => {
    setEditing({ ...result });
    setOpenEditModal(true);
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    if (!editing) return;

    setEditing({
      ...editing,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();

    if (!editing) return;

    setResults((prev) =>
      prev.map((item) => (item.id === editing.id ? editing : item)),
    );

    setOpenEditModal(false);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Results Management</h1>

        <Button onClick={() => setOpenModal(true)}>Add Result</Button>
      </div>

      <Modal
        open={openEditModal}
        title="Edit Result"
        onClose={() => setOpenEditModal(false)}
      >
        {editing && (
          <form onSubmit={handleUpdate} className="space-y-4">
            <Input
              label="Draw Date"
              name="drawDate"
              type="date"
              value={editing.drawDate}
              onChange={handleEditChange}
            />

            <Select
              label="Draw Type"
              name="drawType"
              value={editing.drawType}
              onChange={handleEditChange}
              options={[
                { label: "2D", value: "2D" },
                { label: "3D", value: "3D" },
              ]}
            />

            <Select
              label="Session"
              name="session"
              value={editing.session}
              onChange={handleEditChange}
              options={[
                { label: "AM", value: "AM" },
                { label: "PM", value: "PM" },
              ]}
            />

            <Input
              label="Winning Number"
              name="winningNumber"
              value={editing.winningNumber}
              onChange={handleEditChange}
            />

            <Select
              label="Status"
              name="status"
              value={editing.status}
              onChange={handleEditChange}
              options={[
                { label: "Published", value: "Published" },
                { label: "Draft", value: "Draft" },
              ]}
            />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenEditModal(false)}
              >
                Cancel
              </Button>

              <Button type="submit" variant="secondary">
                Update
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Result List */}
      <div className="bg-white rounded-xl shadow p-5 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-100">
              <th className="p-3">Date</th>
              <th className="p-3">Type</th>
              <th className="p-3">Session</th>
              <th className="p-3">Number</th>
              <th className="p-3">Status</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {results.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50">
                <td className="p-3">{item.drawDate}</td>

                <td className="p-3">{item.drawType}</td>

                <td className="p-3">{item.session}</td>

                <td className="p-3 font-bold">{item.winningNumber}</td>

                <td className="p-3">{item.status}</td>

                <td className="p-3">
                  <div className="flex gap-2">
                    <Button variant="primary" onClick={() => handleEdit(item)}>
                      Edit
                    </Button>

                    <Button
                      variant="danger"
                      onClick={() => handleDelete(item.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Result Modal */}
      <Modal
        open={openModal}
        title="Add Lottery Result"
        onClose={() => setOpenModal(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Draw Date"
            type="date"
            name="drawDate"
            value={result.drawDate}
            onChange={handleChange}
            required
          />

          <Select
            label="Draw Type"
            name="drawType"
            value={result.drawType}
            onChange={handleChange}
            options={[
              { label: "2D", value: "2D" },
              { label: "3D", value: "3D" },
            ]}
          />

          <Select
            label="Draw Session"
            name="session"
            value={result.session}
            onChange={handleChange}
            options={[
              { label: "AM", value: "AM" },
              { label: "PM", value: "PM" },
            ]}
          />

          <Input
            label="Winning Number"
            name="winningNumber"
            placeholder="25"
            value={result.winningNumber}
            onChange={handleChange}
            required
          />

          <Select
            label="Status"
            name="status"
            value={result.status}
            onChange={handleChange}
            options={[
              { label: "Published", value: "Published" },
              { label: "Draft", value: "Draft" },
            ]}
          />

          <Input
            label="Created By"
            name="createdBy"
            value={result.createdBy}
            disabled
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenModal(false)}
            >
              Cancel
            </Button>

            <Button type="submit" variant="success">
              Save Result
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
