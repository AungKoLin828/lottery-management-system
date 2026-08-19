import { Link } from "react-router-dom";
import { useState } from "react";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  LockKeyhole,
  Phone,
  ShieldCheck,
} from "lucide-react";

import Input from "@/components/common/Input";
import Button from "@/components/common/Button";

/* ============================================================
   TYPES
============================================================ */

type ForgotStep = "PHONE" | "OTP" | "PASSWORD";

/* ============================================================
   COMPONENT
============================================================ */

export default function ForgotPassword() {
  const [step, setStep] = useState<ForgotStep>("PHONE");

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* ==========================================================
     SEND OTP
  ========================================================== */

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }

    setLoading(true);

    try {
      /*
       * Connect this to your Netlify Function:
       *
       * POST /.netlify/functions/auth-forgot-password
       *
       * Example body:
       * {
       *   phone
       * }
       */

      const response = await fetch("/.netlify/functions/auth-forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Unable to send verification code.");
        return;
      }

      setSuccess("Verification code has been sent to your phone.");

      setStep("OTP");
    } catch (error) {
      console.error(error);

      setError("Unable to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
     VERIFY OTP
  ========================================================== */

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!otp.trim()) {
      setError("Please enter the verification code.");
      return;
    }

    if (otp.length !== 6) {
      setError("Verification code must contain 6 digits.");
      return;
    }

    setLoading(true);

    try {
      /*
       * Connect this to your Netlify Function:
       *
       * POST /.netlify/functions/auth-verify-reset-otp
       *
       * Example body:
       * {
       *   phone,
       *   otp
       * }
       */

      const response = await fetch(
        "/.netlify/functions/auth-verify-reset-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone,
            otp,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Invalid or expired verification code.");
        return;
      }

      setSuccess("Verification successful. Please create a new password.");

      setStep("PASSWORD");
    } catch (error) {
      console.error(error);

      setError("Unable to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
     RESET PASSWORD
  ========================================================== */

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!password) {
      setError("Please enter a new password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      /*
       * Connect this to your Netlify Function:
       *
       * POST /.netlify/functions/auth-reset-password
       *
       * Example body:
       * {
       *   phone,
       *   otp,
       *   password,
       *   confirmPassword
       * }
       */

      const response = await fetch("/.netlify/functions/auth-reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
          otp,
          password,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Unable to reset your password.");
        return;
      }

      setSuccess("Your password has been reset successfully.");

      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    } catch (error) {
      console.error(error);

      setError("Unable to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
     STEP INFORMATION
  ========================================================== */

  const getStepTitle = () => {
    if (step === "PHONE") {
      return "Forgot your password?";
    }

    if (step === "OTP") {
      return "Verify your phone";
    }

    return "Create new password";
  };

  const getStepDescription = () => {
    if (step === "PHONE") {
      return "Enter your registered phone number and we'll send you a verification code.";
    }

    if (step === "OTP") {
      return `Enter the 6-digit verification code sent to ${phone}.`;
    }

    return "Create a new password for your LotteryPlay account.";
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-50 px-4 py-8 sm:px-6">
      {/* =====================================================
          BACKGROUND
      ====================================================== */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-indigo-200/30 blur-3xl" />

        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-violet-200/30 blur-3xl" />

        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-100/30 blur-3xl" />
      </div>

      {/* =====================================================
          MAIN CARD
      ====================================================== */}

      <div className="relative z-10 w-full max-w-[430px]">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-300/30">
          {/* =================================================
              TOP GRADIENT
          ================================================== */}

          <div className="h-1 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600" />

          <div className="p-6 sm:p-8">
            {/* =================================================
                ICON
            ================================================== */}

            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-indigo-500/20 blur-xl" />

                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/20">
                  {step === "PHONE" && <KeyRound className="h-6 w-6" />}

                  {step === "OTP" && <ShieldCheck className="h-6 w-6" />}

                  {step === "PASSWORD" && <LockKeyhole className="h-6 w-6" />}
                </div>
              </div>
            </div>

            {/* =================================================
                TITLE
            ================================================== */}

            <div className="mt-6 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600">
                Account Recovery
              </p>

              <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                {getStepTitle()}
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {getStepDescription()}
              </p>
            </div>

            {/* =================================================
                STEP INDICATOR
            ================================================== */}

            <div className="mt-7 flex items-center justify-center gap-2">
              {/* Step 1 */}
              <div
                className={`h-2 w-10 rounded-full transition-all ${
                  step === "PHONE" ? "bg-indigo-600" : "bg-indigo-200"
                }`}
              />

              {/* Step 2 */}
              <div
                className={`h-2 w-10 rounded-full transition-all ${
                  step === "OTP"
                    ? "bg-indigo-600"
                    : step === "PASSWORD"
                      ? "bg-indigo-200"
                      : "bg-slate-200"
                }`}
              />

              {/* Step 3 */}
              <div
                className={`h-2 w-10 rounded-full transition-all ${
                  step === "PASSWORD" ? "bg-indigo-600" : "bg-slate-200"
                }`}
              />
            </div>

            {/* =================================================
                SUCCESS MESSAGE
            ================================================== */}

            {success && (
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />

                <p className="text-xs font-semibold leading-5 text-emerald-700">
                  {success}
                </p>
              </div>
            )}

            {/* =================================================
                ERROR MESSAGE
            ================================================== */}

            {error && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-xs font-semibold leading-5 text-red-600">
                  {error}
                </p>
              </div>
            )}

            {/* =================================================
                STEP 1 - PHONE
            ================================================== */}

            {step === "PHONE" && (
              <form onSubmit={handleSendOtp} className="mt-7 space-y-5">
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
                    onChange={(e) => setPhone(e.target.value)}
                  />

                  <p className="mt-2 text-[11px] leading-4 text-slate-400">
                    Use the phone number registered with your LotteryPlay
                    account.
                  </p>
                </div>

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
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Sending code...
                    </>
                  ) : (
                    <>
                      Send Verification Code
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* =================================================
                STEP 2 - OTP
            ================================================== */}

            {step === "OTP" && (
              <form onSubmit={handleVerifyOtp} className="mt-7 space-y-5">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
                      <ShieldCheck className="h-3.5 w-3.5" />
                    </div>

                    <label
                      htmlFor="otp"
                      className="text-xs font-bold text-slate-700"
                    >
                      Verification Code
                    </label>
                  </div>

                  <Input
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                  />

                  <p className="mt-2 text-[11px] leading-4 text-slate-400">
                    Enter the verification code sent to your phone.
                  </p>
                </div>

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
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify Code
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setSuccess("");
                    setOtp("");
                    setStep("PHONE");
                  }}
                  className="w-full text-center text-xs font-semibold text-indigo-600 transition hover:text-indigo-700"
                >
                  Use a different phone number
                </button>
              </form>
            )}

            {/* =================================================
                STEP 3 - NEW PASSWORD
            ================================================== */}

            {step === "PASSWORD" && (
              <form onSubmit={handleResetPassword} className="mt-7 space-y-5">
                {/* New Password */}

                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
                      <LockKeyhole className="h-3.5 w-3.5" />
                    </div>

                    <label
                      htmlFor="password"
                      className="text-xs font-bold text-slate-700"
                    >
                      New Password
                    </label>
                  </div>

                  <Input
                    name="password"
                    type="password"
                    placeholder="Create a new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                {/* Confirm Password */}

                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-50 text-violet-600">
                      <LockKeyhole className="h-3.5 w-3.5" />
                    </div>

                    <label
                      htmlFor="confirmPassword"
                      className="text-xs font-bold text-slate-700"
                    >
                      Confirm New Password
                    </label>
                  </div>

                  <Input
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                {/* Password Information */}

                <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />

                  <p className="text-[11px] leading-4 text-slate-500">
                    Use at least 6 characters and avoid using an easily guessed
                    password.
                  </p>
                </div>

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
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Resetting password...
                    </>
                  ) : (
                    <>
                      Reset Password
                      <CheckCircle2 className="h-4 w-4 transition-transform group-hover:scale-110" />
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* =================================================
                BACK TO LOGIN
            ================================================== */}

            <div className="mt-7 border-t border-slate-200 pt-6">
              <Link
                to="/login"
                className="flex w-full items-center justify-center gap-2 text-xs font-bold text-slate-500 transition hover:text-indigo-600"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Login
              </Link>
            </div>
          </div>

          {/* =================================================
              SECURITY FOOTER
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
          Secure account recovery for LotteryPlay
        </p>
      </div>
    </div>
  );
}
