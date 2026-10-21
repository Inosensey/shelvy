import {
  COLORS,
  escapeHtml,
  wrapEmail,
  emailButton,
  sanitizeSubject,
} from './emailLayout';

interface PaymentFailedParams {
  recipientName: string;
  organizationName: string;
  planName: 'PREMIUM' | 'ENTERPRISE';
  amountInCents: number;
  currency: string;
  /** When the account gets downgraded/suspended if payment isn't recovered. */
  gracePeriodEndsAt: Date;
  billingUrl: string;
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

export function buildPaymentFailedEmail({
  recipientName,
  organizationName,
  planName,
  amountInCents,
  currency,
  gracePeriodEndsAt,
  billingUrl,
}: PaymentFailedParams) {
  const recipient = escapeHtml(recipientName);
  const org = escapeHtml(organizationName);
  const plan = planName === 'PREMIUM' ? 'Premium' : 'Enterprise';
  const amount = formatAmount(amountInCents, currency);
  const graceDate = formatDate(gracePeriodEndsAt);

  const subject = sanitizeSubject(`Action needed: your Shelvy payment failed`);

  const bodyHtml = `
    <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:normal;line-height:1.3;color:${COLORS.ink};">
      We couldn't process your payment
    </h1>

    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;">
      Hi ${recipient}, we tried to charge <strong>${amount}</strong> for
      <strong>${org}</strong>'s <strong>${plan}</strong> subscription, but the payment didn't go through.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
      <tr>
        <td style="border-left:3px solid ${COLORS.danger};padding:4px 0 4px 14px;font-size:14px;line-height:1.6;color:${COLORS.muted};">
          We'll automatically retry the charge over the next few days. If it doesn't go through by
          <strong style="color:${COLORS.ink};">${graceDate}</strong>, ${org}'s access may be limited
          until payment is resolved.
        </td>
      </tr>
    </table>

    ${emailButton(billingUrl, 'Update payment method', COLORS.danger, COLORS.paper)}

    <p style="margin:0;font-size:13px;line-height:1.6;color:${COLORS.muted};">
      If you've already updated your card, you can ignore this -- we'll retry automatically.
    </p>`;

  const text = [
    "We couldn't process your payment",
    '',
    `Hi ${recipientName}, we tried to charge ${amount} for ${organizationName}'s ${plan} subscription, but it didn't go through.`,
    '',
    `We'll retry automatically. If it doesn't succeed by ${graceDate}, access may be limited until payment is resolved.`,
    '',
    `Update your payment method: ${billingUrl}`,
  ].join('\n');

  const html = wrapEmail({
    previewText: `Payment of ${amount} failed for ${organizationName} -- action needed.`,
    bodyHtml,
    footerNote: `Sent by Shelvy on behalf of ${organizationName}.`,
  });

  return { subject, html, text };
}
