import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({
  label,
  error,
  className = "",
  ...props
}: InputProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}

      <input
        {...props}
        className={`
          w-full rounded-lg
          border px-3 py-2
          focus:ring-2
          focus:ring-blue-500
          outline-none
          ${className}
        `}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
