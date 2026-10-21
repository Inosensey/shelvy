export const COLORS = {
  ink: '#2C3639',
  clay: '#A27B5C',
  linen: '#DCD7C9',
  paper: '#F7F5F0',
  muted: '#5C6B6C',
  // A warm red-brown rather than a jarring pure red -- stays in the same
  // family as clay so a failed-payment email still looks like it's from
  // the same product, just with urgency dialed up.
  danger: '#B3492C',
};

// Names, org names, and other user-supplied strings end up inside HTML, so
// escape them. Without this, an organization literally named
// `<a href="evil.com">` becomes a live link in an email from your domain.
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface WrapEmailOptions {
  /** Hidden preheader text -- the preview line shown next to the subject
   *  in most inboxes. Keep it under ~100 characters. */
  previewText: string;
  /** Inner content, already built by the specific template. */
  bodyHtml: string;
  /** Extra line appended to the footer, e.g. "Sent on behalf of Acme Co." */
  footerNote?: string;
}

export function wrapEmail({
  previewText,
  bodyHtml,
  footerNote,
}: WrapEmailOptions): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:${COLORS.linen};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    ${escapeHtml(previewText)}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${COLORS.linen}">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">

          <tr>
            <td bgcolor="${COLORS.ink}" style="padding:24px 32px;border-radius:12px 12px 0 0;">
              <span style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-style:italic;color:${COLORS.linen};">
                Shelvy
              </span>
            </td>
          </tr>

          <tr>
            <td bgcolor="${COLORS.paper}" style="padding:32px;font-family:Inter,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;color:${COLORS.ink};">
              ${bodyHtml}
            </td>
          </tr>

          <tr>
            <td bgcolor="${COLORS.paper}" style="padding:0 32px 24px;border-radius:0 0 12px 12px;font-family:Inter,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;color:${COLORS.muted};border-top:1px solid ${COLORS.linen};">
              ${footerNote ? `<p style="margin:16px 0 0;">${escapeHtml(footerNote)}</p>` : ''}
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Table-based button (renders correctly in Outlook, unlike a plain <a> with padding). */
export function emailButton(
  url: string,
  label: string,
  color: string = COLORS.clay,
  textColor: string = COLORS.ink,
): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
    <tr>
      <td bgcolor="${color}" style="border-radius:6px;">
        <a href="${escapeHtml(url)}" target="_blank"
           style="display:inline-block;padding:13px 28px;font-family:Inter,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;font-weight:bold;color:${textColor};text-decoration:none;">
          ${escapeHtml(label)}
        </a>
      </td>
    </tr>
  </table>`;
}

/** Strips newlines so a user-controlled value (org name, product name) in
 *  the subject line can't inject extra email headers. */
export function sanitizeSubject(subject: string): string {
  return subject.replace(/[\r\n]+/g, ' ');
}
