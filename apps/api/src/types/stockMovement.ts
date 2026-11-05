import { MovementType } from 'generated/prisma/enums';

export interface ApplyMovementInput {
  organizationId: string;
  productId: string;
  performedById: string;
  type: MovementType;
  delta: number; // signed
  reason?: string | null;
  note?: string | null;
}
