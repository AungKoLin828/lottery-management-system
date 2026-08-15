import { Link } from "react-router-dom";
import { useState } from "react";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    const response = await fetch("/.netlify/functions/auth-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        phone,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message);
      return;
    }

    console.log("Logged in:", data.data.user);

    // Navigate according to role here.
  } catch (error) {
    console.error(error);
    alert("Unable to connect to server");
  }
};

  return (
    <div
      className="
      min-h-screen
      flex
      items-center
      justify-center
      bg-gray-100
    "
    >
      <div
        className="
        bg-white
        shadow-lg
        rounded-xl
        p-8
        w-full
        max-w-md
      "
      >
        <h1
          className="
          text-2xl
          font-bold
          text-center
          mb-6
        "
        >
          Login
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Phone"
            name="phone"
            type="tel"
            placeholder="Enter phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <Input
            label="Password"
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button type="submit" className="w-full">
            Login
          </Button>
        </form>

        <p
          className="
          text-center
          text-sm
          mt-5
        "
        >
          Don't have an account?
          <Link
            to="/register"
            className="
              text-blue-600
              ml-1
            "
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
