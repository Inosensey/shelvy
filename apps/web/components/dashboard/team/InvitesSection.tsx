"use client";

import { useState } from "react";
import { InviteTabs } from "@/components/dashboard/team/InviteTabs";
import { RoleBadge } from "@/components/dashboard/team/RoleBadge";
import { RevokeInviteButton } from "@/components/dashboard/team/RevokeInviteButton";
import { ResendInviteButton } from "@/components/dashboard/team/ResendInviteButton";

export function InvitesSection({ invites }: { invites: OrgInvite[] }) {
  const [tab, setTab] = useState<"PENDING" | "REVOKED">("PENDING");

  const pending = invites.filter((i) => i.status === "PENDING");
  const revoked = invites.filter((i) => i.status === "REVOKED");
  const visible = tab === "PENDING" ? pending : revoked;

  if (invites.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium text-linen/70">Invites</h2>
          <p className="mt-0.5 text-xs text-linen/40">
            Invites expire 7 days after being sent or resent.
          </p>
        </div>
        <InviteTabs
          active={tab}
          onChange={setTab}
          pendingCount={pending.length}
          revokedCount={revoked.length}
        />
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-linen/10">
        {visible.length === 0 ? (
          <p className="px-5 py-6 text-center text-xs text-linen/40">
            No {tab} invites.
          </p>
        ) : (
          <ul className="divide-y divide-linen/10">
            {visible.map((invite) => (
              <li
                key={invite.token}
                className="flex items-center justify-between gap-4 px-5 py-3.5"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm text-linen/80">{invite.email}</span>
                  <RoleBadge role={invite.role} />
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-linen/40">
                    Invited{" "}
                    {new Date(invite.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  {tab === "PENDING" ? (
                    <RevokeInviteButton token={invite.token} />
                  ) : (
                    <ResendInviteButton token={invite.token} />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
