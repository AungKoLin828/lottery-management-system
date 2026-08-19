import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  ArrowRight,
  LockKeyhole,
  Phone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import Input from "@/components/common/Input";
import Button from "@/components/common/Button";

import { validateMyanmarPhone } from "@/utils/myanmarPhone";

/* ============================================================
   TYPES
============================================================ */

interface LoginUser {
  id: string | number;
  phone?: string;
  name?: string;
  role?: string;
  status?: string;
}

interface LoginResponse {
  success: boolean;
  message?: string;

  data?: {
    user?: LoginUser;
  };
}

/* ============================================================
   COMPONENT
============================================================ */

export default function Login() {
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ============================================================
     LOGIN
  ============================================================ */

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");

    /* ==========================================================
       PHONE VALIDATION + NORMALIZATION
    ========================================================== */

    const phoneResult = validateMyanmarPhone(phone);

    if (!phoneResult.valid) {
      setError(phoneResult.message);
      return;
    }

    /**
     * This is the normalized E.164 phone number.
     *
     * Example:
     *
     * User enters:
     *
     * 09123456789
     *
     * Backend receives:
     *
     * +959123456789
     */
    const normalizedPhone = phoneResult.normalized;

    /* ==========================================================
       PASSWORD VALIDATION
    ========================================================== */

    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      /* ========================================================
         LOGIN REQUEST
      ======================================================== */

      const response = await fetch("/api/auth/login", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        /**
         * Important:
         *
         * Allows the browser to receive/store
         * the authentication cookie.
         */
        credentials: "include",

        body: JSON.stringify({
          phone: normalizedPhone,
          password,
        }),
      });

      /* ========================================================
         PARSE RESPONSE
      ======================================================== */

      let data: LoginResponse;

      try {
        data = (await response.json()) as LoginResponse;
      } catch {
        setError("Invalid response from server. Please try again.");

        return;
      }

      /* ========================================================
         LOGIN ERROR
      ======================================================== */

      if (!response.ok || !data.success) {
        setError(data.message || "Invalid phone number or password.");

        return;
      }

      /* ========================================================
         AUTHENTICATED USER
      ======================================================== */

      const loggedInUser = data.data?.user;

      if (!loggedInUser) {
        setError("Login succeeded, but user information was not returned.");

        return;
      }

      console.log("Login successful:", loggedInUser);

      /* ========================================================
         ROLE
      ======================================================== */

      const role = String(loggedInUser.role ?? "")
        .trim()
        .toUpperCase();

      /* ========================================================
         ROLE-BASED REDIRECT
      ======================================================== */

      switch (role) {
        /* ======================================================
           PLAYER
        ====================================================== */

        case "PLAYER":
          navigate("/player", {
            replace: true,
          });

          break;

        /* ======================================================
           ADMIN
        ====================================================== */

        case "ADMIN":
          navigate("/admin", {
            replace: true,
          });

          break;

        /* ======================================================
           UNKNOWN ROLE
        ====================================================== */

        default:
          console.error("Unknown user role:", loggedInUser.role);

          setError(
            "Your account role is not supported. Please contact support.",
          );

          break;
      }
    } catch (error) {
      console.error("LOGIN ERROR:", error);

      setError("Unable to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="relative flex min-h-[calc(100vh-72px)] items-center justify-center overflow-hidden bg-slate-50 px-4 py-8 sm:px-6">
      {/* =====================================================
          BACKGROUND
      ====================================================== */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-indigo-200/30 blur-3xl" />

        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-violet-200/30 blur-3xl" />

        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-100/30 blur-3xl" />
      </div>

      {/* =====================================================
          LOGIN CARD
      ====================================================== */}

      <div className="relative z-10 w-full max-w-[430px]">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-300/30">
          {/* TOP GRADIENT */}

          <div className="h-1 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600" />

          <div className="p-6 sm:p-8">
            {/* =================================================
                ICON
            ================================================== */}

            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-indigo-500/20 blur-xl" />

                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/20">
                  <Sparkles className="h-6 w-6" />
                </div>
              </div>
            </div>

            {/* =================================================
                TITLE
            ================================================== */}

            <div className="mt-6 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600">
                Player / Admin Login
              </p>

              <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Welcome back
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Sign in to continue to your account.
              </p>
            </div>

            {/* =================================================
                ERROR
            ================================================== */}

            {error && (
              <div
                role="alert"
                aria-live="polite"
                className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
              >
                <p className="text-xs font-semibold leading-5 text-red-600">
                  {error}
                </p>
              </div>
            )}

            {/* =================================================
                FORM
            ================================================== */}

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              {/* =================================================
                  PHONE
              ================================================== */}

              <div>
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
                    <Phone className="h-3.5 w-3.5" />
                  </div>

                  <label
                    htmlFor="phone"
                    className="text-xs font-bold text-slate-700"
                  >
                    Phone Number
                  </label>
                </div>

                <Input
                  name="phone"
                  type="tel"
                  placeholder="09xxxxxxxxx"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);

                    if (error) {
                      setError("");
                    }
                  }}
                  autoComplete="tel"
                  disabled={loading}
                />
              </div>

              {/* =================================================
                  PASSWORD
              ================================================== */}

              <div>
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-50 text-violet-600">
                    <LockKeyhole className="h-3.5 w-3.5" />
                  </div>

                  <label
                    htmlFor="password"
                    className="text-xs font-bold text-slate-700"
                  >
                    Password
                  </label>
                </div>

                <Input
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);

                    if (error) {
                      setError("");
                    }
                  }}
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>

              {/* =================================================
                  FORGOT PASSWORD
              ================================================== */}

              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-indigo-600 transition hover:text-indigo-700"
                >
                  Forgot password?
                </Link>
              </div>

              {/* =================================================
                  LOGIN BUTTON
              ================================================== */}

              <Button
                type="submit"
                disabled={loading}
                className="
                  group
                  flex
                  w-full
                  items-center
                  justify-center
                  gap-2
                  !rounded-xl
                  !bg-gradient-to-r
                  !from-indigo-600
                  !to-violet-600
                  !py-3
                  text-sm
                  font-bold
                  !text-white
                  shadow-lg
                  shadow-indigo-600/20
                  transition-all
                  hover:-translate-y-0.5
                  hover:!from-indigo-500
                  hover:!to-violet-500
                  active:translate-y-0
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </form>

            {/* =================================================
                DIVIDER
            ================================================== */}

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />

              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                New player?
              </span>

              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {/* =================================================
                REGISTER
            ================================================== */}

            <Link
              to="/register"
              className="
                flex
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                px-4
                py-3
                text-sm
                font-bold
                text-slate-700
                transition-all
                hover:border-indigo-200
                hover:bg-indigo-50
                hover:text-indigo-700
              "
            >
              Create an account
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* =================================================
              SECURITY
          ================================================== */}

          <div className="border-t border-slate-100 bg-slate-50 px-5 py-3.5">
            <div className="flex items-center justify-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />

              <span className="text-[10px] font-medium text-slate-500">
                Your account information is securely protected
              </span>
            </div>
          </div>
        </div>

        {/* =================================================
            SMALL FOOTER
        ================================================== */}

        <p className="mt-5 text-center text-[10px] font-medium text-slate-400">
          Secure access to your player account
        </p>
      </div>
    </div>
  );
}
