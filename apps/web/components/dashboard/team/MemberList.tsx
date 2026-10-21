"use client";

import { RoleBadge } from "@/components/dashboard/team/RoleBadge";
import { RemoveMemberButton } from "./RemoveMemberButton";
import { useEffect } from "react";
import { useSocket } from "../../../app/dashboard/SocketProvider";
import { useRouter } from "next/navigation";
import { memberJoinedListener } from "@/lib/socket/listeners/memberJoin.listener";

interface MemberListProps {
  members: OrgMember[];
  currentUserId: string;
  isOwner: boolean;
}

export function MemberList({
  members,
  currentUserId,
  isOwner,
}: MemberListProps) {
  const socket = useSocket();
  const router = useRouter();

  useEffect(() => {
    const { cleanUp } = memberJoinedListener(socket, router);

    return cleanUp;
  }, [socket, router]);

  return (
    <section className="rounded-xl border border-linen/10 bg-surface">
      <div className="border-b border-linen/10 px-5 py-4">
        <h2 className="font-display text-lg text-linen">Members</h2>
      </div>

      <ul className="divide-y divide-linen/10">
        {members.map((member) => {
          const canRemove =
            isOwner && member.role !== "OWNER" && member.id !== currentUserId;
          return (
            <li key={member.id} className="flex items-center gap-3 px-5 py-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-clay/15 text-sm font-medium text-clay">
                {member.usersInfo[0].firstName!.charAt(0).toUpperCase() +
                  member.usersInfo[0].lastName!.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-linen">
                  {member.usersInfo[0].firstName} {member.usersInfo[0].lastName}
                </p>
                <p className="truncate text-xs text-linen/45">{member.email}</p>
              </div>

              <RoleBadge role={member.role} />

              <span className="hidden shrink-0 text-xs text-linen/40 sm:inline">
                Joined{" "}
                {new Date(member.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </span>

              <div className="w-24 shrink-0 text-right">
                {canRemove && (
                  <RemoveMemberButton
                    memberEmail={member.email}
                    memberId={member.id}
                    memberName={
                      member.usersInfo[0].firstName +
                      " " +
                      member.usersInfo[0].lastName
                    }
                  />
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
