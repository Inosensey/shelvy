const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ]!,
  );

type Item = { title: string; message: string; url: string };

export function buildDigestEmail(p: {
  items: Item[];
  total: number;
  appUrl: string;
  manageUrl: string;
}) {
  const more = p.total - p.items.length;
  const subject =
    p.total === 1 ? p.items[0].title : `${p.total} new notifications on Shelvy`;

  const rows = p.items
    .map(
      (i) => `<tr><td style="padding:12px 0;border-bottom:1px solid #eee">
        <a href="${esc(i.url)}" style="color:#1a56db;font-weight:600;text-decoration:underline">${esc(i.title)}</a>
        <span style="color:#555">${esc(i.message)}</span></td></tr>`,
    )
    .join('');

  const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#111">
    <h2 style="margin:0 0 8px">You have unread notifications</h2>
    <table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
    ${more > 0 ? `<p style="color:#555">…and ${more} more.</p>` : ''}
    <p><a href="${esc(p.appUrl)}" style="color:#111">Open Shelvy</a></p>
    <p style="font-size:12px;color:#888">You're receiving this because you have notification emails turned on.
    <a href="${esc(p.manageUrl)}" style="color:#888">Manage notification settings</a></p>
  </div>`;

  const text =
    p.items.map((i) => `${i.title}\n${i.message}\n${i.url}`).join('\n\n') +
    (more > 0 ? `\n\n…and ${more} more.` : '') +
    `\n\nOpen Shelvy: ${p.appUrl}\nManage notification settings: ${p.manageUrl}`;

  return { subject, html, text };
}
