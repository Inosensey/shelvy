import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { RegisterForm } from "@/components/auth/RegisterForm";
import type { PlanId } from "@/utils/plans";

const VALID_PLANS: PlanId[] = ["FREE", "PREMIUM", "ENTERPRISE"];

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;
  const initialPlan = VALID_PLANS.includes(plan as PlanId) ? (plan as PlanId) : undefined;

  return (
    <AuthCard
      heading="Create your account"
      subheading="Pick a plan to get started."
      maxWidthClassName="max-w-2xl"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-clay hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm initialPlan={initialPlan} />
    </AuthCard>
  );
}
