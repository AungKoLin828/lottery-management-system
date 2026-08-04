import { Link } from "react-router-dom";
import { useState } from "react";

import Input from "@/components/common/Input";
import Button from "@/components/common/Button";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log(form);

    // TODO:
    // Call register API
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
          Create Account
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            name="name"
            placeholder="Enter name"
            value={form.name}
            onChange={handleChange}
          />

          <Input
            label="Phone"
            name="phone"
            type="phone"
            placeholder="Enter phone"
            value={form.phone}
            onChange={handleChange}
          />

          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="Enter password"
            value={form.password}
            onChange={handleChange}
          />

          <Input
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            placeholder="Confirm password"
            value={form.confirmPassword}
            onChange={handleChange}
          />

          <Button type="submit" className="w-full">
            Register
          </Button>
        </form>

        <p className="text-center text-sm mt-5">
          Already have an account?
          <Link to="/login" className="text-blue-600 ml-1">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
