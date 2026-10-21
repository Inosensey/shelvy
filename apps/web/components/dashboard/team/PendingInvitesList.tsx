// PendingInvitesList.tsx
import { RoleBadge } from "@/components/dashboard/team/RoleBadge";
import { RevokeInviteButton } from "./RevokeInviteButton";

export function PendingInvitesList({
  invites,
  isOwner,
}: {
  invites: OrgInvite[];
  isOwner: boolean;
}) {
  if (invites.length === 0) return null;

  return (
    <section className="rounded-xl border border-linen/10 bg-surface">
      <div className="border-b border-linen/10 px-5 py-4">
        <h2 className="font-display text-lg text-linen">Pending Invites</h2>
      </div>
      <ul className="divide-y divide-linen/10">
        {invites.map((invite) => (
          <li key={invite.id} className="flex items-center gap-3 px-5 py-3.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-linen">{invite.email}</p>
              <p className="text-xs text-linen/40">
                Invited{" "}
                {new Date(invite.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            <RoleBadge role={invite.role} />
            {isOwner && <RevokeInviteButton token={invite.token} />}
          </li>
        ))}
      </ul>
    </section>
  );
}
