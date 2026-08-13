import { useState } from "react";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log("Contact Form:", form);

    alert("Your message has been submitted successfully.");

    setForm({
      name: "",
      email: "",
      phone: "",
      message: "",
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">

      <div className="text-center mb-10">

        <h1 className="text-3xl font-bold">
          Contact Us
        </h1>

        <p className="text-gray-500 mt-2">
          Have a question? Contact our support team.
        </p>

      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Contact Information */}

        <div className="bg-white rounded-xl shadow p-6">

          <h2 className="text-xl font-bold mb-6">
            Contact Information
          </h2>

          <div className="space-y-5">

            <div>
              <p className="text-sm text-gray-500">
                Phone
              </p>

              <p className="font-medium mt-1">
                09 123456789
              </p>
            </div>


            <div>
              <p className="text-sm text-gray-500">
                Email
              </p>

              <p className="font-medium mt-1">
                admin@lottery.com
              </p>
            </div>


            <div>
              <p className="text-sm text-gray-500">
                Address
              </p>

              <p className="font-medium mt-1">
                Yangon, Myanmar
              </p>
            </div>


            <div>
              <p className="text-sm text-gray-500">
                Telegram
              </p>

              <p className="font-medium mt-1">
                @lottery
              </p>
            </div>

          </div>

        </div>


        {/* Contact Form */}

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow p-6"
        >

          <h2 className="text-xl font-bold mb-6">
            Send Message
          </h2>


          <div className="space-y-4">

            <div>

              <label className="block text-sm font-medium mb-1">
                Name
              </label>

              <input
                type="text"
                required
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
                className="w-full border rounded-lg px-3 py-2"
              />

            </div>


            <div>

              <label className="block text-sm font-medium mb-1">
                Email
              </label>

              <input
                type="email"
                required
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value,
                  })
                }
                className="w-full border rounded-lg px-3 py-2"
              />

            </div>


            <div>

              <label className="block text-sm font-medium mb-1">
                Phone
              </label>

              <input
                type="text"
                value={form.phone}
                onChange={(e) =>
                  setForm({
                    ...form,
                    phone: e.target.value,
                  })
                }
                className="w-full border rounded-lg px-3 py-2"
              />

            </div>


            <div>

              <label className="block text-sm font-medium mb-1">
                Message
              </label>

              <textarea
                required
                rows={5}
                value={form.message}
                onChange={(e) =>
                  setForm({
                    ...form,
                    message: e.target.value,
                  })
                }
                className="w-full border rounded-lg px-3 py-2"
              />

            </div>


            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              Send Message
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}