import { InputHTMLAttributes } from "react";

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: React.ReactNode;
  /** null/undefined = untouched, true = valid, false = invalid */
  valid?: boolean | null;
  validationMessage?: string;
}

export function AuthInput({
  label,
  hint,
  id,
  valid,
  validationMessage,
  ...props
}: AuthInputProps) {
  const isInvalid = valid === false;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm font-medium text-linen">
          {label}
        </label>
        {hint}
      </div>
      <input
        id={id}
        aria-invalid={isInvalid}
        aria-describedby={isInvalid ? `${id}-error` : undefined}
        {...props}
        className={`w-full rounded-md border bg-ink/40 px-3 py-2 text-[15px]
                   text-linen placeholder:text-linen/35
                   outline-none transition-[colors,opacity] duration-150
                   focus:ring-2 disabled:opacity-50
                   ${
                     isInvalid
                       ? "border-red-400/60 focus:border-red-400 focus:ring-red-400/25"
                       : "border-linen/15 focus:border-clay focus:ring-clay/30"
                   }`}
      />
      {isInvalid && (
        <span id={`${id}-error`} className="text-xs font-medium text-red-400">
          {validationMessage}
        </span>
      )}
    </div>
  );
}
