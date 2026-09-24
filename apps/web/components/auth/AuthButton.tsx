"use client";

import { ButtonHTMLAttributes } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Loader2 } from "lucide-react";

interface AuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  loading?: boolean;
  loadingText?: string;
}

export function AuthButton({
  variant = "primary",
  loading = false,
  loadingText,
  className = "",
  children,
  disabled,
  ...props
}: AuthButtonProps) {
  const base =
    "relative w-full rounded-md px-4 py-2.5 text-[15px] font-medium transition-colors duration-150 cursor-pointer " +
    "focus:outline-none focus:ring-2 focus:ring-clay/40 focus:ring-offset-2 focus:ring-offset-surface " +
    "disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-clay text-ink hover:bg-clay/90 disabled:bg-clay/60",
    secondary:
      "border border-linen/20 bg-transparent text-linen hover:bg-linen/5 disabled:text-linen/50",
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {/* Reserve space with an invisible copy so the button never changes width/height */}
      <span className="invisible flex items-center justify-center gap-2">
        {children}
      </span>

      <span className="absolute inset-0 flex items-center justify-center gap-2">
        <AnimatePresence mode="wait" initial={false}>
          {loading ? (
            <motion.span
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2"
            >
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
              {loadingText ?? children}
            </motion.span>
          ) : (
            <motion.span
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2"
            >
              {children}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </button>
  );
}
