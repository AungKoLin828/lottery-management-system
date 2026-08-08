import { useState } from "react";

import Button from "@/components/common/Button";
import Input from "@/components/common/Input";

export default function LotteryNumberSettings() {
  const [enable2D, setEnable2D] = useState(true);
  const [enable3D, setEnable3D] = useState(true);

  const [twoD, setTwoD] = useState({
    enabled: true,
    numberLength: 2,
    minBet: 100,
    maxBet: 100000,
    maxNumberLimit: 10,
    allowDuplicateNumbers: false,
  });

  const [threeD, setThreeD] = useState({
    enabled: true,
    numberLength: 3,
    minBet: 100,
    maxBet: 100000,
    maxNumberLimit: 10,
    allowDuplicateNumbers: false,
  });

  const handleSave2D = () => {
    console.log("2D settings:", twoD);
    alert("2D settings saved successfully.");
  };

  const handleSave3D = () => {
    console.log("3D settings:", threeD);
    alert("3D settings saved successfully.");
  };

  return (
    <div className="space-y-6">
      {/* Lottery Types */}
      <div className="bg-white rounded-xl shadow p-5">
        <h2 className="text-xl font-bold mb-4">Lottery Types</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 2D */}
          <div className="border rounded-lg p-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">2D Lottery</h3>

              <p className="text-sm text-gray-500">
                Enable or disable 2D lottery
              </p>
            </div>

            <input
              type="checkbox"
              checked={enable2D}
              onChange={(e) => setEnable2D(e.target.checked)}
              className="w-5 h-5"
            />
          </div>

          {/* 3D */}
          <div className="border rounded-lg p-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">3D Lottery</h3>

              <p className="text-sm text-gray-500">
                Enable or disable 3D lottery
              </p>
            </div>

            <input
              type="checkbox"
              checked={enable3D}
              onChange={(e) => setEnable3D(e.target.checked)}
              className="w-5 h-5"
            />
          </div>
        </div>
      </div>

      {/* 2D Settings */}
      <div className="bg-white rounded-xl shadow p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold">2D Settings</h2>

            <p className="text-sm text-gray-500">
              Configure 2D lottery betting rules.
            </p>
          </div>

          <input
            type="checkbox"
            checked={twoD.enabled}
            onChange={(e) =>
              setTwoD({
                ...twoD,
                enabled: e.target.checked,
              })
            }
            className="w-5 h-5"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input
            label="Number Length"
            type="number"
            value={twoD.numberLength}
            onChange={(e) =>
              setTwoD({
                ...twoD,
                numberLength: Number(e.target.value),
              })
            }
          />

          <Input
            label="Minimum Bet (MMK)"
            type="number"
            value={twoD.minBet}
            onChange={(e) =>
              setTwoD({
                ...twoD,
                minBet: Number(e.target.value),
              })
            }
          />

          <Input
            label="Maximum Bet (MMK)"
            type="number"
            value={twoD.maxBet}
            onChange={(e) =>
              setTwoD({
                ...twoD,
                maxBet: Number(e.target.value),
              })
            }
          />

          <Input
            label="Maximum Number Limit"
            type="number"
            value={twoD.maxNumberLimit}
            onChange={(e) =>
              setTwoD({
                ...twoD,
                maxNumberLimit: Number(e.target.value),
              })
            }
          />
        </div>

        <label className="flex items-center gap-2 mt-5">
          <input
            type="checkbox"
            checked={twoD.allowDuplicateNumbers}
            onChange={(e) =>
              setTwoD({
                ...twoD,
                allowDuplicateNumbers: e.target.checked,
              })
            }
            className="w-4 h-4"
          />

          <span className="text-sm">Allow Duplicate Numbers</span>
        </label>

        <div className="flex justify-end mt-5">
          <Button variant="success" onClick={handleSave2D}>
            Save 2D Settings
          </Button>
        </div>
      </div>

      {/* 3D Settings */}
      <div className="bg-white rounded-xl shadow p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold">3D Settings</h2>

            <p className="text-sm text-gray-500">
              Configure 3D lottery betting rules.
            </p>
          </div>

          <input
            type="checkbox"
            checked={threeD.enabled}
            onChange={(e) =>
              setThreeD({
                ...threeD,
                enabled: e.target.checked,
              })
            }
            className="w-5 h-5"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input
            label="Number Length"
            type="number"
            value={threeD.numberLength}
            onChange={(e) =>
              setThreeD({
                ...threeD,
                numberLength: Number(e.target.value),
              })
            }
          />

          <Input
            label="Minimum Bet (MMK)"
            type="number"
            value={threeD.minBet}
            onChange={(e) =>
              setThreeD({
                ...threeD,
                minBet: Number(e.target.value),
              })
            }
          />

          <Input
            label="Maximum Bet (MMK)"
            type="number"
            value={threeD.maxBet}
            onChange={(e) =>
              setThreeD({
                ...threeD,
                maxBet: Number(e.target.value),
              })
            }
          />

          <Input
            label="Maximum Number Limit"
            type="number"
            value={threeD.maxNumberLimit}
            onChange={(e) =>
              setThreeD({
                ...threeD,
                maxNumberLimit: Number(e.target.value),
              })
            }
          />
        </div>

        <label className="flex items-center gap-2 mt-5">
          <input
            type="checkbox"
            checked={threeD.allowDuplicateNumbers}
            onChange={(e) =>
              setThreeD({
                ...threeD,
                allowDuplicateNumbers: e.target.checked,
              })
            }
            className="w-4 h-4"
          />

          <span className="text-sm">Allow Duplicate Numbers</span>
        </label>

        <div className="flex justify-end mt-5">
          <Button variant="success" onClick={handleSave3D}>
            Save 3D Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
