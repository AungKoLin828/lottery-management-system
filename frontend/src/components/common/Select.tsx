import type { SelectHTMLAttributes } from "react";

interface Option {
  label: string;
  value: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Option[];
}

export default function Select({
  label,
  error,
  options,
  className = "",
  ...props
}: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      <select
        {...props}
        className={`
          w-full
          rounded-lg
          border
          border-gray-300
          px-3
          py-2
          bg-white
          focus:outline-none
          focus:ring-2
          focus:ring-blue-500
          ${error ? "border-red-500" : ""}
          ${className}
        `}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}
