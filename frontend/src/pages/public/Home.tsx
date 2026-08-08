import { Link } from "react-router-dom";

const latestResults = [
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
];

export default function Home() {
  return (
    <div>

      {/* =====================================================
          HERO
          ===================================================== */}

      <section className="bg-gradient-to-r from-blue-700 to-blue-500 text-white">

        <div className="max-w-7xl mx-auto px-4 py-20">

          <div className="max-w-3xl">

            <p className="text-blue-100 mb-3">
              2D Lottery Management System
            </p>

            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Check the Latest 2D Lottery Results
            </h1>

            <p className="mt-5 text-lg text-blue-100">
              View the latest lottery results, result history,
              announcements, and manage your lottery account.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">

              <Link
                to="/results-history"
                className="px-6 py-3 bg-white text-blue-700 rounded-lg font-semibold hover:bg-gray-100"
              >
                View Results
              </Link>

              <Link
                to="/register"
                className="px-6 py-3 border border-white rounded-lg font-semibold hover:bg-white hover:text-blue-700"
              >
                Create Account
              </Link>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          LATEST RESULTS
          ===================================================== */}

      <section className="max-w-7xl mx-auto px-4 py-12">

        <div className="flex justify-between items-center mb-6">

          <div>
            <h2 className="text-2xl font-bold">
              Latest Results
            </h2>

            <p className="text-gray-500 mt-1">
              Latest published lottery results
            </p>
          </div>

          <Link
            to="/results-history"
            className="text-blue-600 hover:underline"
          >
            View All
          </Link>

        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {latestResults.map((item) => (

            <div
              key={item.id}
              className="bg-white rounded-xl shadow p-6"
            >

              <div className="flex justify-between">

                <div>
                  <p className="text-sm text-gray-500">
                    {item.date}
                  </p>

                  <h3 className="font-semibold mt-1">
                    {item.session} Draw
                  </h3>
                </div>

                <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm">
                  Published
                </span>

              </div>


              <div className="mt-6 text-center">

                <p className="text-sm text-gray-500">
                  Winning Number
                </p>

                <p className="text-6xl font-bold text-blue-600 mt-2">
                  {item.result}
                </p>

              </div>


              <div className="grid grid-cols-2 gap-4 mt-6">

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500">
                    Set
                  </p>

                  <p className="font-semibold mt-1">
                    {item.setValue}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500">
                    Value
                  </p>

                  <p className="font-semibold mt-1">
                    {item.value}
                  </p>
                </div>

              </div>

            </div>

          ))}

        </div>

      </section>


      {/* =====================================================
          INFORMATION
          ===================================================== */}

      <section className="bg-white py-12">

        <div className="max-w-7xl mx-auto px-4">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <div className="p-6 border rounded-xl">
              <h3 className="font-bold text-lg">
                Latest Results
              </h3>

              <p className="text-gray-500 mt-2">
                Check the latest published lottery numbers.
              </p>
            </div>


            <div className="p-6 border rounded-xl">
              <h3 className="font-bold text-lg">
                Result History
              </h3>

              <p className="text-gray-500 mt-2">
                Search and review previous lottery results.
              </p>
            </div>


            <div className="p-6 border rounded-xl">
              <h3 className="font-bold text-lg">
                Player Account
              </h3>

              <p className="text-gray-500 mt-2">
                Register and manage your lottery account.
              </p>
            </div>

          </div>

        </div>

      </section>

    </div>
  );
}