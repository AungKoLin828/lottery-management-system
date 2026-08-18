import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

import {
  Ticket,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Phone,
} from "lucide-react";

import Input from "@/components/common/Input";
import Button from "@/components/common/Button";

import { register } from "@/api/auth";

import { validateMyanmarPhone } from "@/utils/myanmarPhone";

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

  const [phoneValid, setPhoneValid] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    // Validate phone while typing
    if (name === "phone") {
      const result = validateMyanmarPhone(value);

      setPhoneValid(result.valid);

      // Only show an error after the user has
      // entered enough information.
      if (value.trim().length > 4) {
        setError(result.valid ? "" : result.message);
      } else {
        setError("");
      }
    } else {
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");

    // =====================================================
    // FULL NAME VALIDATION
    // =====================================================

    if (!form.name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (form.name.trim().length < 2) {
      setError("Full name must contain at least 2 characters.");
      return;
    }

    // =====================================================
    // PHONE VALIDATION
    // =====================================================

    const phoneResult = validateMyanmarPhone(form.phone);

    if (!phoneResult.valid) {
      setError(phoneResult.message);
      return;
    }

    // =====================================================
    // PASSWORD VALIDATION
    // =====================================================

    if (!form.password) {
      setError("Please enter a password.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // =====================================================
    // REGISTER
    // =====================================================

    try {
      setLoading(true);

      /*
       * IMPORTANT:
       *
       * Send the normalized E.164 phone number
       * to the backend.
       *
       * Example:
       *
       * 09123456789
       *
       * becomes:
       *
       * +959123456789
       */
      await register(
        form.name.trim(),
        phoneResult.normalized,
        form.password,
        form.confirmPassword,
      );

      navigate("/player/dashboard", {
        replace: true,
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to register");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-100">
      {/* =====================================================
          PAGE CONTAINER
      ====================================================== */}

      <div className="flex min-h-screen w-full items-center justify-center px-4 py-8 sm:px-6">
        {/* ===================================================
            REGISTER CARD
        ==================================================== */}

        <div className="grid w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-300/40 lg:grid-cols-[0.9fr_1.1fr]">
          {/* =================================================
              LEFT BRAND PANEL
          ================================================== */}

          <div className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700 p-10 lg:flex lg:flex-col lg:justify-between">
            {/* Decorative circles */}

            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10" />

            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-violet-400/20" />

            <div className="absolute right-20 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-white/5" />

            {/* =================================================
                BRAND
            ================================================== */}

            <div className="relative z-10">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/20">
                  <Ticket className="h-6 w-6" />
                </div>

                <div>
                  <p className="text-xl font-extrabold tracking-tight text-white">
                    Lottery
                    <span className="text-indigo-200">Play</span>
                  </p>

                  <p className="text-xs font-medium text-indigo-100">
                    Play. Pick. Win.
                  </p>
                </div>
              </div>
            </div>

            {/* =================================================
                MAIN MESSAGE
            ================================================== */}

            <div className="relative z-10 my-12">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-indigo-200">
                Join LotteryPlay
              </p>

              <h1 className="text-4xl font-extrabold leading-tight text-white">
                Start your
                <br />
                lottery journey.
              </h1>

              <p className="mt-5 max-w-sm text-sm leading-6 text-indigo-100">
                Create your account and get access to your tickets, wallet,
                lottery games and results in one place.
              </p>
            </div>

            {/* =================================================
                BENEFITS
            ================================================== */}

            <div className="relative z-10 space-y-3">
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

                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* =================================================
              REGISTER FORM
          ================================================== */}

          <div className="bg-white px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
            {/* =================================================
                MOBILE BRAND
            ================================================== */}

            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20">
                <Ticket className="h-5 w-5" />
              </div>

              <div>
                <p className="text-lg font-extrabold tracking-tight text-slate-900">
                  Lottery
                  <span className="text-indigo-600">Play</span>
                </p>

                <p className="text-[11px] font-medium text-slate-500">
                  Play. Pick. Win.
                </p>
              </div>
            </div>

            {/* =================================================
                HEADER
            ================================================== */}

            <div className="mb-7">
              <p className="mb-2 text-sm font-semibold text-indigo-600">
                Create your account
              </p>

              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                Get started
              </h2>

              <p className="mt-2 text-sm leading-5 text-slate-500">
                Fill in your details to create your LotteryPlay account.
              </p>
            </div>

            {/* =================================================
                ERROR
            ================================================== */}

            {error && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />

                <span>{error}</span>
              </div>
            )}

            {/* =================================================
                FORM
            ================================================== */}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}

              <div>
                <Input
                  label="Full Name"
                  name="name"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={handleChange}
                />
              </div>

              {/* Phone Number */}

              <div>
                <Input
                  label="Myanmar Phone Number"
                  name="phone"
                  type="tel"
                  placeholder="09xxxxxxxxx"
                  value={form.phone}
                  onChange={handleChange}
                />

                {/* Phone information */}

                <div className="mt-2 flex items-start gap-2">
                  <Phone
                    className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                      phoneValid ? "text-emerald-500" : "text-slate-400"
                    }`}
                  />

                  <div className="text-[11px] leading-4">
                    {phoneValid ? (
                      <p className="font-medium text-emerald-600">
                        Valid Myanmar mobile number
                      </p>
                    ) : (
                      <p className="text-slate-500">Example: 09 123 456 789</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Password */}

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

              {/* Confirm Password */}

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

              {/* =================================================
                  PASSWORD SECURITY
              ================================================== */}

              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />

                <p className="text-[11px] leading-4 text-slate-500">
                  Use a strong password to help keep your account secure.
                </p>
              </div>

              {/* =================================================
                  PHONE VERIFICATION INFORMATION
              ================================================== */}

              <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />

                  <div>
                    <p className="text-xs font-bold text-indigo-700">
                      Phone verification
                    </p>

                    <p className="mt-1 text-[11px] leading-4 text-indigo-600">
                      Your Myanmar phone number will be verified after
                      registration.
                    </p>
                  </div>
                </div>
              </div>

              {/* =================================================
                  SUBMIT BUTTON
              ================================================== */}

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

            {/* =================================================
                LOGIN
            ================================================== */}

            <div className="mt-7 border-t border-slate-200 pt-6 text-center">
              <p className="text-sm text-slate-500">Already have an account?</p>

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
