import { CheckCircle2 } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { RedirectCountdown } from "@/components/reusable/RedirectCountdown";

export default async function SubscriptionSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ subscription_id?: string; logged_in?: string }>;
}) {
  const { subscription_id, logged_in } = await searchParams;

  return (
    <AuthCard
      heading="Payment successful"
      subheading={
        logged_in === "true"
          ? "Your account and subscription are now active."
          : "Your subscription is now active."
      }
      footer={
        <span className="text-linen/45">Questions? Contact support.</span>
      }
    >
      <div className="flex flex-col items-center gap-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-clay/15 text-clay">
          <CheckCircle2 className="h-6 w-6" strokeWidth={2} />
        </div>

        {subscription_id && (
          <p className="-mt-3 text-xs text-linen/35">
            Subscription ID: {subscription_id}
          </p>
        )}

        <RedirectCountdown
          redirectTo="/login"
          seconds={5}
          message="Redirecting to sign in"
        />
      </div>
    </AuthCard>
  );
}
