// src/pages/player/Profile.tsx

import { useState } from "react";
import {
  Eye,
  EyeOff,
  Mail,
  Phone,
  User,
  ShieldCheck,
  Save,
  LockKeyhole,
  CheckCircle2,
} from "lucide-react";

export default function Profile() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  const [showNewPassword, setShowNewPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");

  const [newPassword, setNewPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return;
    }

    if (newPassword !== confirmPassword) {
      return;
    }

    if (newPassword.length < 8) {
      return;
    }

    console.log("Change password");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}
      <div>
        <div className="flex items-center gap-2 text-sm font-semibold text-blue-600">
          <User className="h-4 w-4" />

          <span>Account</span>
        </div>

        <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
          Profile
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Manage your personal information and account security.
        </p>
      </div>

      {/* =====================================================
          PROFILE CONTENT
      ====================================================== */}
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* =================================================
            PROFILE SUMMARY
        ================================================== */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center text-center">
            {/* Avatar */}
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-2xl font-bold text-white shadow-md shadow-blue-200">
              AK
            </div>

            <h2 className="mt-4 text-xl font-bold text-gray-900">Player</h2>

            <p className="mt-1 text-sm text-gray-500">player@example.com</p>

            {/* Status */}
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
              Active Account
            </div>
          </div>

          {/* Account Type */}
          <div className="mt-6 border-t border-gray-100 pt-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <ShieldCheck className="h-4 w-4" />
              </div>

              <div>
                <p className="text-xs text-gray-400">Account Type</p>

                <p className="text-sm font-semibold text-gray-800">Player</p>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            RIGHT CONTENT
        ================================================== */}
        <div className="space-y-6">
          {/* =================================================
              PERSONAL INFORMATION
          ================================================== */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            {/* Header */}
            <div className="border-b border-gray-100 pb-5">
              <h2 className="text-lg font-bold text-gray-900">
                Personal Information
              </h2>

              <p className="mt-1 text-sm text-gray-400">
                Update your personal information below.
              </p>
            </div>

            <div className="mt-6 space-y-5">
              {/* Name */}
              <div>
                <label
                  htmlFor="player-name"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Name
                </label>

                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                  <input
                    id="player-name"
                    type="text"
                    defaultValue="Player"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="player-email"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Email
                </label>

                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                  <input
                    id="player-email"
                    type="email"
                    defaultValue="player@example.com"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="player-phone"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Phone
                </label>

                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                  <input
                    id="player-phone"
                    type="tel"
                    defaultValue="09xxxxxxxxx"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />
                </div>
              </div>

              {/* Save */}
              <div className="flex justify-end border-t border-gray-100 pt-5">
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 font-semibold text-white shadow-sm shadow-blue-200 transition-all duration-200 hover:-translate-y-0.5 hover:from-blue-700 hover:to-indigo-700 hover:shadow-md"
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>

          {/* =================================================
              CHANGE PASSWORD
          ================================================== */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            {/* Header */}
            <div className="flex items-start gap-3 border-b border-gray-100 pb-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <LockKeyhole className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Change Password
                </h2>

                <p className="mt-1 text-sm text-gray-400">
                  Update your password to keep your account secure.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {/* =================================================
                  CURRENT PASSWORD
              ================================================== */}
              <div>
                <label
                  htmlFor="current-password"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Current Password
                </label>

                <div className="relative">
                  <LockKeyhole className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                  <input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    placeholder="Enter current password"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-12 text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowCurrentPassword((current) => !current)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                    aria-label={
                      showCurrentPassword
                        ? "Hide current password"
                        : "Show current password"
                    }
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* =================================================
                  NEW PASSWORD
              ================================================== */}
              <div>
                <label
                  htmlFor="new-password"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  New Password
                </label>

                <div className="relative">
                  <LockKeyhole className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                  <input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="Enter new password"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-12 text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />

                  <button
                    type="button"
                    onClick={() => setShowNewPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                    aria-label={
                      showNewPassword
                        ? "Hide new password"
                        : "Show new password"
                    }
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <p className="mt-2 text-xs text-gray-400">
                  Password must contain at least 8 characters.
                </p>
              </div>

              {/* =================================================
                  CONFIRM PASSWORD
              ================================================== */}
              <div>
                <label
                  htmlFor="confirm-password"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Confirm New Password
                </label>

                <div className="relative">
                  <LockKeyhole className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Confirm new password"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-12 text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((current) => !current)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Password Match */}
                {confirmPassword && newPassword === confirmPassword && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-blue-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Passwords match
                  </div>
                )}

                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="mt-2 text-xs font-medium text-red-500">
                    Passwords do not match.
                  </p>
                )}
              </div>

              {/* =================================================
                  CHANGE PASSWORD BUTTON
              ================================================== */}
              <div className="flex justify-end border-t border-gray-100 pt-5">
                <button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={
                    !currentPassword ||
                    !newPassword ||
                    !confirmPassword ||
                    newPassword !== confirmPassword ||
                    newPassword.length < 8
                  }
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 font-semibold text-white shadow-sm shadow-blue-200 transition-all duration-200 hover:-translate-y-0.5 hover:from-blue-700 hover:to-indigo-700 hover:shadow-md disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-300 disabled:shadow-none"
                >
                  <LockKeyhole className="h-4 w-4" />
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
