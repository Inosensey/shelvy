const ROLE_STYLES: Record<role, string> = {
  OWNER: "bg-clay/15 text-clay",
  MANAGER: "bg-linen/10 text-linen/80",
  STAFF: "bg-linen/5 text-linen/55",
};

export function RoleBadge({ role }: { role: role }) {
  const label = role.charAt(0) + role.slice(1).toLowerCase();
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${ROLE_STYLES[role]}`}>
      {label}
    </span>
  );
}