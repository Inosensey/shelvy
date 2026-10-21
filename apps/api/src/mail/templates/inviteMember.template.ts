import {
  COLORS,
  escapeHtml,
  wrapEmail,
  emailButton,
  sanitizeSubject,
} from './emailLayout';

export type InviteRole = 'MANAGER' | 'STAFF';

interface InviteEmailParams {
  inviterName: string;
  organizationName: string;
  role: InviteRole;
  inviteUrl: string;
  expiresInDays: number;
}

const ROLE_COPY: Record<InviteRole, { label: string; blurb: string }> = {
  MANAGER: {
    label: 'Manager',
    blurb:
      "As a Manager, you'll be able to manage products, suppliers, and stock movements, and you'll get notified about low stock alerts.",
  },
  STAFF: {
    label: 'Staff',
    blurb:
      "As Staff, you'll be able to view products and record stock movements for your team.",
  },
};

export function buildInviteEmail({
  inviterName,
  organizationName,
  role,
  inviteUrl,
  expiresInDays,
}: InviteEmailParams) {
  const { label, blurb } = ROLE_COPY[role];

  const inviter = escapeHtml(inviterName);
  const org = escapeHtml(organizationName);

  const subject = sanitizeSubject(
    `${inviterName} invited you to join ${organizationName} on Shelvy`,
  );

  const bodyHtml = `
    <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:normal;line-height:1.3;color:${COLORS.ink};">
      You're invited to join ${org}
    </h1>

    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;">
      <strong>${inviter}</strong> has invited you to join
      <strong>${org}</strong> on Shelvy as a <strong>${label}</strong>.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
      <tr>
        <td style="border-left:3px solid ${COLORS.clay};padding:4px 0 4px 14px;font-size:14px;line-height:1.6;color:${COLORS.muted};">
          ${escapeHtml(blurb)}
        </td>
      </tr>
    </table>

    ${emailButton(inviteUrl, 'Accept invitation')}

    <p style="margin:0 0 6px;font-size:13px;line-height:1.6;color:${COLORS.muted};">
      Button not working? Copy and paste this link into your browser:
    </p>
    <p style="margin:0 0 24px;font-size:13px;line-height:1.5;word-break:break-all;">
      <a href="${escapeHtml(inviteUrl)}" style="color:${COLORS.clay};">${escapeHtml(inviteUrl)}</a>
    </p>

    <p style="margin:0;font-size:13px;line-height:1.6;color:${COLORS.muted};">
      This invitation expires in ${expiresInDays} day${expiresInDays === 1 ? '' : 's'}.
      If you weren't expecting it, you can safely ignore this email.
    </p>`;

  const text = [
    `You're invited to join ${organizationName}`,
    '',
    `${inviterName} has invited you to join ${organizationName} on Shelvy as a ${label}.`,
    '',
    blurb,
    '',
    `Accept your invitation: ${inviteUrl}`,
    '',
    `This invitation expires in ${expiresInDays} day${expiresInDays === 1 ? '' : 's'}.`,
    "If you weren't expecting it, you can safely ignore this email.",
  ].join('\n');

  const html = wrapEmail({
    previewText: `${inviterName} invited you to join ${organizationName} as ${label}.`,
    bodyHtml,
    footerNote: `Sent by Shelvy on behalf of ${organizationName}.`,
  });

  return { subject, html, text };
}
