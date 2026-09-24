import { AuthCard } from "@/components/auth/AuthCard";
import { LogoutButton } from "@/components/dashboard/LogoutButton";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export default async function OnboardingPage() {
  return (
    <AuthCard
      heading="Set up your account"
      subheading="A couple of quick steps and you're in."
      maxWidthClassName="max-w-md"
      topRightSlot={<LogoutButton />}
      footer={
        <span className="text-linen/45">
          You can update these details later.
        </span>
      }
    >
      <OnboardingWizard />
    </AuthCard>
  );
}
