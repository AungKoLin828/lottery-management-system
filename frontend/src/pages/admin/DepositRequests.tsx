import { useEffect, useState } from "react";

export default function DepositRequests() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Deposit request loading will be added here.
    setLoading(false);
  }, []);

  return (
    <div className="min-w-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Deposit Requests</h1>

        <p className="mt-1 text-sm text-gray-500">
          Review and manage player deposit requests.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading deposit requests...
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            No deposit requests found.
          </div>
        )}
      </div>
    </div>
  );
}
