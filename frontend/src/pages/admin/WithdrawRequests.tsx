import { useEffect, useState } from "react";

export default function WithdrawRequests() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Withdraw request loading will be added here.
    setLoading(false);
  }, []);

  return (
    <div className="min-w-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Withdraw Requests</h1>

        <p className="mt-1 text-sm text-gray-500">
          Review and manage player withdrawal requests.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading withdraw requests...
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            No withdraw requests found.
          </div>
        )}
      </div>
    </div>
  );
}
