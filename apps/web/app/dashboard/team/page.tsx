import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { MemberList } from "@/components/dashboard/team/MemberList";
import { InviteMemberControl } from "@/components/dashboard/team/InviteMemberControl";
import { InvitesSection } from "@/components/dashboard/team/InvitesSection";
import { nestJsEndpoints } from "@/lib/nestJsEndpoints";

async function getCurrentUser() {
  const user = await nestJsEndpoints.userApi.getMe();
  return {
    id: user.data!.id,
    role: user.data!.role,
    organizationId: user.data!.organizationId,
  };
}

async function getTeamData(organizationId?: string) {
  let members: OrgMember[] | [] = [];
  let pendingInvites: OrgInvite[] | [] = [];
  let revokedInvites: OrgInvite[] | [] = [];
  let invites: OrgInvite[] | [] = [];

  if (organizationId) {
    members =
      (await nestJsEndpoints.organizationApi.getOrganizationMembers()).data ||
      [];
    pendingInvites =
      (await nestJsEndpoints.organizationApi.getPendingInviteRecords()).data ||
      [];
    revokedInvites =
      (await nestJsEndpoints.organizationApi.getRevokedInviteRecords()).data ||
      [];

    invites = [...pendingInvites, ...revokedInvites];
  }
  return { members, invites };
}

export default async function TeamPage() {
  const currentUser = await getCurrentUser();
  const { members, invites } = await getTeamData(currentUser.organizationId);
  const isOwner = currentUser.role === "OWNER";

  return (
    <>
      <DashboardTopbar title="Team" />
      <main className="flex flex-col gap-6 px-4 py-8 sm:px-8">
        {isOwner && <InviteMemberControl />}
        <MemberList
          members={members}
          currentUserId={currentUser.id}
          isOwner={isOwner}
        />
        {isOwner && <InvitesSection invites={invites} />}
      </main>
    </>
  );
}
