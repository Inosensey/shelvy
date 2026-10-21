import {
  COLORS,
  escapeHtml,
  wrapEmail,
  emailButton,
  sanitizeSubject,
} from './emailLayout';

interface SubscriptionConfirmedParams {
  recipientName: string;
  organizationName: string;
  planName: 'PREMIUM' | 'ENTERPRISE';
  amountInCents: number;
  currency: string;
  renewsAt: Date;
  dashboardUrl: string;
  invoiceUrl?: string;
}

function formatAmount(cents: number, currency: string) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency }).format(
    cents / 100,
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function buildSubscriptionConfirmedEmail({
  recipientName,
  organizationName,
  planName,
  amountInCents,
  currency,
  renewsAt,
  dashboardUrl,
  invoiceUrl,
}: SubscriptionConfirmedParams) {
  const recipient = escapeHtml(recipientName);
  const org = escapeHtml(organizationName);
  const plan = planName === 'PREMIUM' ? 'Premium' : 'Enterprise';
  const amount = formatAmount(amountInCents, currency);
  const renewDate = formatDate(renewsAt);

  const subject = sanitizeSubject(
    `Your Shelvy ${plan} subscription is confirmed`,
  );

  const bodyHtml = `
    <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:normal;line-height:1.3;color:${COLORS.ink};">
      You're all set on ${plan}
    </h1>

    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;">
      Hi ${recipient}, your payment went through and <strong>${org}</strong> is now on the
      <strong>${plan}</strong> plan.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
           style="margin:0 0 28px;border:1px solid ${COLORS.linen};border-radius:8px;">
      <tr>
        <td style="padding:16px 20px;font-size:14px;border-bottom:1px solid ${COLORS.linen};">Plan</td>
        <td align="right" style="padding:16px 20px;font-size:14px;font-weight:bold;border-bottom:1px solid ${COLORS.linen};">${plan}</td>
      </tr>
      <tr>
        <td style="padding:16px 20px;font-size:14px;border-bottom:1px solid ${COLORS.linen};">Amount charged</td>
        <td align="right" style="padding:16px 20px;font-size:14px;font-weight:bold;border-bottom:1px solid ${COLORS.linen};">${amount}</td>
      </tr>
      <tr>
        <td style="padding:16px 20px;font-size:14px;">Renews on</td>
        <td align="right" style="padding:16px 20px;font-size:14px;font-weight:bold;">${renewDate}</td>
      </tr>
    </table>

    ${emailButton(dashboardUrl, 'Go to dashboard')}

    ${
      invoiceUrl
        ? `<p style="margin:0;font-size:13px;line-height:1.6;">
             <a href="${escapeHtml(invoiceUrl)}" style="color:${COLORS.clay};">View your invoice</a>
           </p>`
        : ''
    }`;

  const text = [
    `You're all set on ${plan}`,
    '',
    `Hi ${recipientName}, your payment went through and ${organizationName} is now on the ${plan} plan.`,
    '',
    `Plan: ${plan}`,
    `Amount charged: ${amount}`,
    `Renews on: ${renewDate}`,
    '',
    `Go to dashboard: ${dashboardUrl}`,
    invoiceUrl ? `View your invoice: ${invoiceUrl}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const html = wrapEmail({
    previewText: `Your ${plan} subscription is confirmed -- renews ${renewDate}.`,
    bodyHtml,
    footerNote: `Sent by Shelvy on behalf of ${organizationName}.`,
  });

  return { subject, html, text };
}
