import {
  COLORS,
  escapeHtml,
  wrapEmail,
  emailButton,
  sanitizeSubject,
} from './emailLayout';

interface LowStockProduct {
  name: string;
  currentStock: number;
  lowStockThreshold: number;
  supplierName?: string;
}

interface LowStockAlertParams {
  recipientName: string;
  organizationName: string;
  products: LowStockProduct[];
  dashboardAlertsUrl: string;
}

export function buildLowStockAlertEmail({
  recipientName,
  organizationName,
  products,
  dashboardAlertsUrl,
}: LowStockAlertParams) {
  const recipient = escapeHtml(recipientName);
  const org = escapeHtml(organizationName);
  const isSingle = products.length === 1;

  const subject = sanitizeSubject(
    isSingle
      ? `Low stock: ${products[0].name}`
      : `Low stock alert: ${products.length} products need attention`,
  );

  const rows = products
    .map(
      (p) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid ${COLORS.linen};font-size:14px;">
        <strong>${escapeHtml(p.name)}</strong>
        ${p.supplierName ? `<br/><span style="font-size:12px;color:${COLORS.muted};">Supplier: ${escapeHtml(p.supplierName)}</span>` : ''}
      </td>
      <td align="right" style="padding:10px 0;border-bottom:1px solid ${COLORS.linen};font-size:14px;white-space:nowrap;">
        <span style="color:${COLORS.danger};font-weight:bold;">${p.currentStock}</span>
        <span style="color:${COLORS.muted};"> / ${p.lowStockThreshold} threshold</span>
      </td>
    </tr>`,
    )
    .join('');

  const bodyHtml = `
    <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:normal;line-height:1.3;color:${COLORS.ink};">
      ${isSingle ? 'A product is running low' : `${products.length} products are running low`}
    </h1>

    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;">
      Hi ${recipient}, the following ${isSingle ? 'product has' : 'products have'} dropped below
      ${isSingle ? 'its' : 'their'} low-stock threshold in <strong>${org}</strong>:
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
      ${rows}
    </table>

    ${emailButton(dashboardAlertsUrl, 'View alerts')}

    <p style="margin:0;font-size:13px;line-height:1.6;color:${COLORS.muted};">
      You're receiving this because you have alerts enabled for ${org}.
    </p>`;

  const text = [
    isSingle
      ? 'A product is running low'
      : `${products.length} products are running low`,
    '',
    `Hi ${recipientName}, the following ${isSingle ? 'product has' : 'products have'} dropped below threshold in ${organizationName}:`,
    '',
    ...products.map(
      (p) =>
        `- ${p.name}: ${p.currentStock} / ${p.lowStockThreshold} threshold${p.supplierName ? ` (Supplier: ${p.supplierName})` : ''}`,
    ),
    '',
    `View alerts: ${dashboardAlertsUrl}`,
  ].join('\n');

  const html = wrapEmail({
    previewText: isSingle
      ? `${products[0].name} is running low (${products[0].currentStock} left).`
      : `${products.length} products are running low in ${organizationName}.`,
    bodyHtml,
    footerNote: `Sent by Shelvy on behalf of ${organizationName}.`,
  });

  return { subject, html, text };
}
