import { useState } from "react";

import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Select from "@/components/common/Select";

interface BlockedNumber {
  id: number;
  number: string;
  type: "2D" | "3D";
  reason: string;
}

export default function NumberRestrictions() {
  const [number, setNumber] = useState("");
  const [lotteryType, setLotteryType] = useState<"2D" | "3D">("2D");
  const [reason, setReason] = useState("");

  const [blockedNumbers, setBlockedNumbers] = useState<BlockedNumber[]>([
    {
      id: 1,
      number: "00",
      type: "2D",
      reason: "Restricted number",
    },
    {
      id: 2,
      number: "13",
      type: "2D",
      reason: "Admin restriction",
    },
    {
      id: 3,
      number: "123",
      type: "3D",
      reason: "Restricted number",
    },
  ]);

  const handleBlock = () => {
    const expectedLength = lotteryType === "2D" ? 2 : 3;

    if (!number) {
      alert("Please enter a number.");
      return;
    }

    if (!/^\d+$/.test(number)) {
      alert("Only numbers are allowed.");
      return;
    }

    if (number.length !== expectedLength) {
      alert(`${lotteryType} number must contain ${expectedLength} digits.`);
      return;
    }

    const exists = blockedNumbers.some(
      (item) => item.number === number && item.type === lotteryType,
    );

    if (exists) {
      alert("This number is already blocked.");
      return;
    }

    const newNumber: BlockedNumber = {
      id: Date.now(),
      number,
      type: lotteryType,
      reason: reason.trim() || "Admin restriction",
    };

    setBlockedNumbers((prev) => [...prev, newNumber]);

    setNumber("");
    setReason("");
  };

  const handleUnblock = (id: number) => {
    setBlockedNumbers((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSave = () => {
    console.log("Blocked numbers:", blockedNumbers);

    alert("Number restrictions saved successfully.");
  };

  return (
    <div className="space-y-6">
      {/* Block Number */}
      <div className="bg-white rounded-xl shadow p-5">
        <h2 className="text-xl font-bold mb-1">Number Restrictions</h2>

        <p className="text-sm text-gray-500 mb-5">
          Block specific 2D or 3D numbers from ticket purchases.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Lottery Type"
            value={lotteryType}
            onChange={(e) => setLotteryType(e.target.value as "2D" | "3D")}
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

          <Input
            label={lotteryType === "2D" ? "2D Number" : "3D Number"}
            value={number}
            maxLength={lotteryType === "2D" ? 2 : 3}
            onChange={(e) => setNumber(e.target.value.replace(/\D/g, ""))}
            placeholder={lotteryType === "2D" ? "00" : "000"}
          />

          <Input
            label="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Admin restriction"
          />
        </div>

        <div className="flex justify-end mt-5">
          <Button variant="success" onClick={handleBlock}>
            Block Number
          </Button>
        </div>
      </div>

      {/* Blocked Numbers */}
      <div className="bg-white rounded-xl shadow p-5">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold">Blocked Numbers</h2>

            <p className="text-sm text-gray-500">
              Currently restricted lottery numbers.
            </p>
          </div>

          <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">
            {blockedNumbers.length} Blocked
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="p-3 text-left">Number</th>

                <th className="p-3 text-left">Type</th>

                <th className="p-3 text-left">Reason</th>

                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {blockedNumbers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-5 text-center text-gray-500">
                    No blocked numbers.
                  </td>
                </tr>
              ) : (
                blockedNumbers.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-3 font-bold">{item.number}</td>

                    <td className="p-3">
                      <span className="px-2 py-1 bg-gray-100 rounded">
                        {item.type}
                      </span>
                    </td>

                    <td className="p-3">{item.reason}</td>

                    <td className="p-3 text-center">
                      <Button
                        variant="outline"
                        onClick={() => handleUnblock(item.id)}
                      >
                        Unblock
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mt-5">
          <Button variant="success" onClick={handleSave}>
            Save Restrictions
          </Button>
        </div>
      </div>
    </div>
  );
}
