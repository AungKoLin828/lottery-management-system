import {
  Link,
  useNavigate,
} from "react-router-dom";

import { useState } from "react";

import Input from "@/components/common/Input";
import Button from "@/components/common/Button";

import { register } from "@/api/auth";

export default function Register() {
  const navigate =
    useNavigate();

  const [form, setForm] =
    useState({
      name: "",
      phone: "",
      password: "",
      confirmPassword: "",
    });

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setForm((previous) => ({
      ...previous,
      [e.target.name]:
        e.target.value,
    }));
  };

  const handleSubmit =
    async (
      e: React.FormEvent,
    ) => {
      e.preventDefault();

      setError("");

      if (
        form.password !==
        form.confirmPassword
      ) {
        setError(
          "Passwords do not match.",
        );

        return;
      }

      try {
        setLoading(true);

        await register(
          form.name,
          form.phone,
          form.password,
          form.confirmPassword,
        );

        navigate(
          "/player/dashboard",
          {
            replace: true,
          },
        );
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to register",
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold">
          Create Account
        </h1>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <Input
            label="Full Name"
            name="name"
            placeholder="Enter name"
            value={form.name}
            onChange={
              handleChange
            }
          />

          <Input
            label="Phone"
            name="phone"
            type="tel"
            placeholder="Enter phone"
            value={form.phone}
            onChange={
              handleChange
            }
          />

          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="Enter password"
            value={form.password}
            onChange={
              handleChange
            }
          />

          <Input
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            placeholder="Confirm password"
            value={
              form.confirmPassword
            }
            onChange={
              handleChange
            }
          />

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading
              ? "Creating account..."
              : "Register"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm">
          Already have an account?

          <Link
            to="/login"
            className="ml-1 text-blue-600 hover:text-blue-700"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}