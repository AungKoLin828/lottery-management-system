import {
  Link,
  useNavigate,
} from "react-router-dom";

import { useState } from "react";

import {
  Ticket,
  User,
  Phone,
  LockKeyhole,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

import Input from "@/components/common/Input";
import Button from "@/components/common/Button";

import { register } from "@/api/auth";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setForm((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault();

    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
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

      navigate("/player/dashboard", {
        replace: true,
      });
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
    <div className="min-h-screen bg-slate-950 px-4 py-8 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/40 lg:grid-cols-[0.9fr_1.1fr]">

          {/* =====================================================
              LEFT BRAND PANEL
          ====================================================== */}

          <div className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700 p-10 lg:flex lg:flex-col lg:justify-between">
            
            {/* Decorative circles */}

            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10" />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-violet-400/20" />

            {/* Brand */}

            <div className="relative">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/20">
                  <Ticket className="h-6 w-6" />
                </div>

                <div>
                  <p className="text-xl font-extrabold tracking-tight text-white">
                    Lottery<span className="text-indigo-200">Play</span>
                  </p>

                  <p className="text-xs font-medium text-indigo-100">
                    Play. Pick. Win.
                  </p>
                </div>
              </div>
            </div>

            {/* Main message */}

            <div className="relative my-12">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-indigo-200">
                Join LotteryPlay
              </p>

              <h1 className="text-4xl font-extrabold leading-tight text-white">
                Start your
                <br />
                lottery journey.
              </h1>

              <p className="mt-5 max-w-sm text-sm leading-6 text-indigo-100">
                Create your account and get access to your
                tickets, wallet, lottery games and results
                in one place.
              </p>
            </div>

            {/* Benefits */}

            <div className="relative space-y-3">
              {[
                "Easy account registration",
                "Manage your lottery tickets",
                "Secure wallet access",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 text-sm font-medium text-white"
                >
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-indigo-200" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* =====================================================
              REGISTER FORM
          ====================================================== */}

          <div className="bg-white px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">

            {/* Mobile brand */}

            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20">
                <Ticket className="h-5 w-5" />
              </div>

              <div>
                <p className="text-lg font-extrabold tracking-tight text-slate-900">
                  Lottery<span className="text-indigo-600">Play</span>
                </p>

                <p className="text-[11px] font-medium text-slate-500">
                  Play. Pick. Win.
                </p>
              </div>
            </div>

            {/* Header */}

            <div className="mb-7">
              <p className="mb-2 text-sm font-semibold text-indigo-600">
                Create your account
              </p>

              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                Get started
              </h2>

              <p className="mt-2 text-sm leading-5 text-slate-500">
                Fill in your details to create your
                LotteryPlay account.
              </p>
            </div>

            {/* Error */}

            {error && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />

                <span>{error}</span>
              </div>
            )}

            {/* Form */}

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div>
                <Input
                  label="Full Name"
                  name="name"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Input
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={form.phone}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Input
                  label="Password"
                  name="password"
                  type="password"
                  placeholder="Create a password"
                  value={form.password}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Input
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                />
              </div>

              {/* Password security */}

              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />

                <p className="text-[11px] leading-4 text-slate-500">
                  Use a strong password to help keep your
                  account secure.
                </p>
              </div>

              {/* Submit */}

              <Button
                type="submit"
                disabled={loading}
                className="
                  group
                  mt-2
                  flex
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  !bg-gradient-to-r
                  !from-indigo-600
                  !to-violet-600
                  py-3
                  font-bold
                  text-white
                  shadow-lg
                  shadow-indigo-500/20
                  transition-all
                  duration-200
                  hover:-translate-y-0.5
                  hover:shadow-xl
                  hover:shadow-indigo-500/25
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                  disabled:hover:translate-y-0
                "
              >
                {loading ? (
                  "Creating account..."
                ) : (
                  <>
                    Create Account

                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </form>

            {/* Login */}

            <div className="mt-7 border-t border-slate-200 pt-6 text-center">
              <p className="text-sm text-slate-500">
                Already have an account?
              </p>

              <Link
                to="/login"
                className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-indigo-600 transition hover:text-indigo-700"
              >
                Sign in to your account
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}