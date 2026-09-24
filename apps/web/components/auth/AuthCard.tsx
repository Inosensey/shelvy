import Link from "next/link";
import { ReactNode } from "react";

interface AuthCardProps {
  heading: string;
  subheading?: string;
  children: ReactNode;
  footer: ReactNode;
  topRightSlot?: ReactNode;
  /** Override the card's max width, e.g. "max-w-2xl" for a wider layout
   *  like a plan-picker register form. Defaults to the standard login width. */
  maxWidthClassName?: string;
}

export function AuthCard({
  heading,
  subheading,
  children,
  footer,
  maxWidthClassName = "max-w-[380px]",
  topRightSlot,
}: AuthCardProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-4 py-12">
      {" "}
      {topRightSlot && (
        <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
          {topRightSlot}
        </div>
      )}
      {/* Wordmark slot -- swap for your icon whenever it's ready */}
      <Link href="/" className="mb-8 flex flex-col items-center gap-3">
        <div
          aria-hidden
          className="h-9 w-9 rounded-md border border-dashed border-linen/25"
        />
        <span className="font-display text-lg italic text-linen/70">
          Shelvy
        </span>
      </Link>
      <div className={`w-full ${maxWidthClassName}`}>
        <div className="relative overflow-hidden rounded-xl border border-linen/10 bg-surface shadow-[0_1px_0_0_rgba(220,215,201,0.05)_inset]">
          {/* Signature hairline: a soft clay gradient tracing the top edge */}
          <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-clay/70 to-transparent" />

          <div className="px-8 py-9">
            <div className="mb-7 text-center">
              <h1 className="font-display text-[26px] leading-tight text-linen">
                {heading}
              </h1>
              {subheading && (
                <p className="mt-1.5 text-sm text-linen/55">{subheading}</p>
              )}
            </div>

            {children}
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-linen/10 bg-surface/50 py-4 text-center text-sm text-linen/70">
          {footer}
        </div>
      </div>
    </div>
  );
}
