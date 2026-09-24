import Link from "next/link";
import { XCircle } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";

export default async function SubscriptionCancelPage() {
  return (
    <AuthCard
      heading="Checkout canceled"
      subheading="No charge was made -- your card was not billed."
      footer={
        <>
          Changed your mind?{" "}
          <Link href="/register" className="font-medium text-clay hover:underline">
            Pick a plan again
          </Link>
        </>
      }
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-linen/10 text-linen/50">
          <XCircle className="h-6 w-6" strokeWidth={2} />
        </div>
        <p className="text-sm text-linen/55">
          You can try again anytime, or reach out if something went wrong during checkout.
        </p>
        <Link
          href="/register"
          className="rounded-md bg-clay px-6 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-clay/90"
        >
          Back to plans
        </Link>
      </div>
    </AuthCard>
  );
}