// stripe.repository.ts

import { Inject, Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeRepository {
  constructor(@Inject('STRIPE_CLIENT') private readonly stripe: Stripe) {}

  async createCustomer(email: string): Promise<Stripe.Customer> {
    return await this.stripe.customers.create({
      email,
      // metadata: {
      //   shelvyUserId,
      // },
    });
  }

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
}
