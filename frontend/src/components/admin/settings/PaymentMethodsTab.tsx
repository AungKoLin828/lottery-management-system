import { useState } from "react";

import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Modal from "@/components/common/Modal";

import type { PaymentMethod, PaymentMethodType } from "@/types/settings";

interface PaymentMethodsTabProps {
  paymentMethods: PaymentMethod[];
  setPaymentMethods: React.Dispatch<React.SetStateAction<PaymentMethod[]>>;
  onDelete: (id: number) => void;
}

const emptyPaymentMethod: PaymentMethod = {
  id: 0,
  name: "",
  type: "Both",
  enabled: true,
  qrCode: "",
  accountName: "",
  accountNumber: "",
  bankName: "",
  branch: "",
  displayOrder: 1,
};

export default function PaymentMethodsTab({
  paymentMethods,
  setPaymentMethods,
  onDelete,
}: PaymentMethodsTabProps) {
  const [showModal, setShowModal] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState<PaymentMethod>(emptyPaymentMethod);

  /* ==========================================================
     ADD
  ========================================================== */

  const openAdd = () => {
    setForm({
      ...emptyPaymentMethod,
      id: Date.now(),
      displayOrder: paymentMethods.length + 1,
    });

    setEditingId(null);
    setShowModal(true);
  };

  /* ==========================================================
     EDIT
  ========================================================== */

  const openEdit = (method: PaymentMethod) => {
    setForm({
      ...method,
    });

    setEditingId(method.id);
    setShowModal(true);
  };

  /* ==========================================================
     SAVE
  ========================================================== */

  const savePaymentMethod = () => {
    if (!form.name.trim()) {
      alert("Payment method name is required.");
      return;
    }

    if (!form.accountName.trim()) {
      alert("Account name is required.");
      return;
    }

    if (!form.accountNumber.trim()) {
      alert("Account number is required.");
      return;
    }

    if (editingId !== null) {
      setPaymentMethods((prev) =>
        prev.map((method) => (method.id === editingId ? form : method)),
      );

      alert("Payment method updated successfully.");
    } else {
      setPaymentMethods((prev) => [...prev, form]);

      alert("Payment method added successfully.");
    }

    setShowModal(false);
    setEditingId(null);
  };

  /* ==========================================================
     TOGGLE
  ========================================================== */

  const togglePaymentMethod = (id: number) => {
    setPaymentMethods((prev) =>
      prev.map((method) =>
        method.id === id
          ? {
              ...method,
              enabled: !method.enabled,
            }
          : method,
      ),
    );
  };

  /* ==========================================================
     SAVE ALL
  ========================================================== */

  const savePaymentMethods = () => {
    console.log("Payment Methods:", paymentMethods);

    alert("Payment methods saved successfully.");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-6 shadow">
        {/* HEADER */}

        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">Payment Methods</h2>

            <p className="text-sm text-gray-500">
              Manage deposit and withdraw payment methods.
            </p>
          </div>

          <Button variant="success" onClick={openAdd}>
            + Add Payment Method
          </Button>
        </div>

        {/* TABLE */}

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
              {[...paymentMethods]
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((method) => (
                  <tr key={method.id} className="border-b">
                    <td className="p-3">{method.displayOrder}</td>

                    <td className="p-3 font-medium">{method.name}</td>

                    <td className="p-3">
                      <span className="rounded bg-gray-100 px-2 py-1">
                        {method.type}
                      </span>
                    </td>

                    <td className="p-3">{method.accountName}</td>

                    <td className="p-3">{method.accountNumber}</td>

                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => togglePaymentMethod(method.id)}
                        className={`rounded-full px-3 py-1 text-sm ${
                          method.enabled
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {method.enabled ? "Enabled" : "Disabled"}
                      </button>
                    </td>

                    <td className="p-3">
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="outline"
                          onClick={() => openEdit(method)}
                        >
                          Edit
                        </Button>

                        <Button
                          variant="danger"
                          onClick={() => onDelete(method.id)}
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

        {/* SAVE */}

        <div className="mt-6 flex justify-end">
          <Button variant="success" onClick={savePaymentMethods}>
            Save Payment Methods
          </Button>
        </div>
      </div>

      {/* ======================================================
          PAYMENT MODAL
      ====================================================== */}

      <Modal
        open={showModal}
        title={
          editingId !== null ? "Edit Payment Method" : "Add Payment Method"
        }
        onClose={() => setShowModal(false)}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            savePaymentMethod();
          }}
          className="space-y-4"
        >
          <Input
            label="Payment Method Name"
            value={form.name}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                name: e.target.value,
              }))
            }
            placeholder="KBZPay"
          />

          <div>
            <label className="mb-1 block text-sm font-medium">Type</label>

            <select
              className="w-full rounded-lg border p-2"
              value={form.type}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  type: e.target.value as PaymentMethodType,
                }))
              }
            >
              <option value="Deposit">Deposit</option>
              <option value="Withdraw">Withdraw</option>
              <option value="Both">Both</option>
            </select>
          </div>

          <Input
            label="Account Name"
            value={form.accountName}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                accountName: e.target.value,
              }))
            }
          />

          <Input
            label="Account Number"
            value={form.accountNumber}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                accountNumber: e.target.value,
              }))
            }
          />

          <Input
            label="Bank Name"
            value={form.bankName}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                bankName: e.target.value,
              }))
            }
          />

          <Input
            label="Branch"
            value={form.branch}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                branch: e.target.value,
              }))
            }
          />

          <Input
            label="Display Order"
            type="number"
            value={String(form.displayOrder)}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                displayOrder: Number(e.target.value),
              }))
            }
          />

          {/* QR */}

          <div>
            <label className="mb-1 block text-sm font-medium">QR Code</label>

            <input
              type="file"
              accept="image/*"
              className="w-full rounded-lg border p-2"
              onChange={(e) => {
                const file = e.target.files?.[0];

                if (!file) {
                  return;
                }

                const url = URL.createObjectURL(file);

                setForm((prev) => ({
                  ...prev,
                  qrCode: url,
                }));
              }}
            />

            {form.qrCode && (
              <img
                src={form.qrCode}
                alt={`${form.name} QR Code`}
                className="mt-3 h-32 w-32 rounded border object-contain"
              />
            )}
          </div>

          {/* ACTIONS */}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>

            <Button type="submit" variant="success">
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
