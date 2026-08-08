import { useState } from "react";

interface Result {
  id: number;
  date: string;
  session: "Morning" | "Evening";
  result: string;
  setValue: string;
  value: string;
}

const mockResults: Result[] = [
  {
    id: 1,
    date: "2026-08-08",
    session: "Morning",
    result: "27",
    setValue: "123.45",
    value: "67.89",
  },
  {
    id: 2,
    date: "2026-08-07",
    session: "Evening",
    result: "58",
    setValue: "456.78",
    value: "12.34",
  },
  {
    id: 3,
    date: "2026-08-07",
    session: "Morning",
    result: "14",
    setValue: "234.56",
    value: "45.67",
  },
  {
    id: 4,
    date: "2026-08-06",
    session: "Evening",
    result: "92",
    setValue: "345.67",
    value: "78.90",
  },
  {
    id: 5,
    date: "2026-08-06",
    session: "Morning",
    result: "36",
    setValue: "567.89",
    value: "23.45",
  },
];

export default function ResultsHistory() {
  const [search, setSearch] = useState("");
  const [session, setSession] = useState("All");

  const filteredResults = mockResults.filter((item) => {

    const matchesSearch =
      item.date.includes(search) ||
      item.result.includes(search);

    const matchesSession =
      session === "All" ||
      item.session === session;

    return matchesSearch && matchesSession;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">

      <div className="mb-8">

        <h1 className="text-3xl font-bold">
          Results History
        </h1>

        <p className="text-gray-500 mt-2">
          View previous 2D lottery results.
        </p>

      </div>


      {/* Filters */}

      <div className="bg-white rounded-xl shadow p-5 mb-6">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div>

            <label className="block text-sm font-medium mb-2">
              Search
            </label>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search date or number..."
              className="w-full border rounded-lg px-3 py-2"
            />

          </div>


          <div>

            <label className="block text-sm font-medium mb-2">
              Session
            </label>

            <select
              value={session}
              onChange={(e) => setSession(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="All">All Sessions</option>
              <option value="Morning">Morning</option>
              <option value="Evening">Evening</option>
            </select>

          </div>

        </div>

      </div>


      {/* Results */}

      <div className="bg-white rounded-xl shadow overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead>
              <tr className="bg-gray-100 border-b">

                <th className="p-4 text-left">
                  Date
                </th>

                <th className="p-4 text-left">
                  Session
                </th>

                <th className="p-4 text-center">
                  Result
                </th>

                <th className="p-4 text-center">
                  Set
                </th>

                <th className="p-4 text-center">
                  Value
                </th>

              </tr>
            </thead>


            <tbody>

              {filteredResults.length > 0 ? (
                filteredResults.map((item) => (

                  <tr
                    key={item.id}
                    className="border-b hover:bg-gray-50"
                  >

                    <td className="p-4">
                      {item.date}
                    </td>

                    <td className="p-4">
                      {item.session}
                    </td>

                    <td className="p-4 text-center">

                      <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-700 font-bold text-lg">
                        {item.result}
                      </span>

                    </td>

                    <td className="p-4 text-center">
                      {item.setValue}
                    </td>

                    <td className="p-4 text-center">
                      {item.value}
                    </td>

                  </tr>

                ))
              ) : (

                <tr>

                  <td
                    colSpan={5}
                    className="p-10 text-center text-gray-500"
                  >
                    No results found.
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}