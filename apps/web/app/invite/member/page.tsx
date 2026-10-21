import { InviteStatusCard } from "@/components/onboarding/InviteStatusCard";
import { AuthCard } from "@/components/auth/AuthCard";
import { MemberOnboardingWizard } from "@/components/onboarding/MemberOnboardingWizard";
import { nestJsEndpoints } from "@/lib/nestJsEndpoints";
import { helpers } from "@/lib/helpers";
import { LogoutButton } from "@/components/dashboard/LogoutButton";
import { AcceptInviteButton } from "@/components/onboarding/AcceptInviteButton";
import Link from "next/link";

interface OnboardingInvitePageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function OnboardingInvitePage({
  searchParams,
}: OnboardingInvitePageProps) {
  const { token } = await searchParams;
  const result =
    await nestJsEndpoints.organizationApi.validateInviteToken(token);
  const inviteStatus = String(result.data!.status);
  const invite = result.data?.invite;
  if (inviteStatus !== "PENDING" || !invite) {
    return (
      <InviteStatusCard
        status={inviteStatus === "PENDING" ? "EXPIRED" : result.data!.status}
      />
    );
  }

  if (!invite.isExistingUser) {
    return (
      <AuthCard
        heading="Finish setting up"
        subheading={`Joining ${invite.organizationName}`}
        footer={
          <span className="text-linen/45">
            Already have an account? Sign in instead.
          </span>
        }
      >
        <MemberOnboardingWizard token={token as string} email={invite.email} />
      </AuthCard>
    );
  }

  const currentUser = await helpers.getCurrentUserOrNull();
  const returnTo = `/invite/member?token=${encodeURIComponent(token as string)}`;
  const wrongAccount =
    currentUser &&
    currentUser.email.toLowerCase() !== invite?.email.toLowerCase();

  console.log(currentUser);

  return (
    <AuthCard
      heading={`Join ${invite.organizationName}`}
      subheading={`${invite.inviterName} invited you as ${invite.role.toLowerCase()}`}
      footer=""
    >
      {!currentUser ? (
        <Link
          href={`/login?redirect=${encodeURIComponent(returnTo)}`}
          className="block w-full rounded-md bg-clay px-6 py-2.5 text-center text-sm font-medium text-ink hover:bg-clay/90"
        >
          Log in to accept
        </Link>
      ) : wrongAccount ? (
        <div className="flex flex-col gap-3 text-sm text-linen/70">
          <p>
            This invite is for{" "}
            <span className="text-linen">{invite.email}</span>, but you&apos;re
            signed in as <span className="text-linen">{currentUser.email}</span>
            .
          </p>
          <LogoutButton
            redirectTo={`/login?redirect=${encodeURIComponent(returnTo)}`}
          />
        </div>
      ) : currentUser.organizationId ? (
        <p className="text-sm text-linen/70">
          This account already belongs to an organization.
        </p>
      ) : (
        <AcceptInviteButton token={token as string} />
      )}
    </AuthCard>
  );
}
