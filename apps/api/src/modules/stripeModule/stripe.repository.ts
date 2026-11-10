// stripe.repository.ts

import { Inject, Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeRepository {
  constructor(@Inject('STRIPE_CLIENT') private readonly stripe: Stripe) {}

  async updateCustomerShelvyId(
    customerId: string,
    shelvyUserId: string,
  ): Promise<Stripe.Customer> {
    return await this.stripe.customers.update(customerId, {
      metadata: {
        shelvyUserId,
      },
    });
  }

  async createBillingPortalSession(
    customerId: string,
    returnUrl: string,
  ): Promise<Stripe.BillingPortal.Session> {
    return await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }
}
