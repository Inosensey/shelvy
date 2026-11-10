import { PaymentStatus } from 'generated/prisma/enums';

export type PaymentInput = {
  subscriptionId: string;
  stripeInvoiceId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  failureReason?: string;
  periodStart: Date;
  periodEnd: Date;
};
