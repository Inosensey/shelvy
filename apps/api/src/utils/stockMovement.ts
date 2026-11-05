import { BadRequestException } from '@nestjs/common';
import { MovementType } from 'generated/prisma/enums';

export function toDelta(input: {
  type: MovementType;
  quantity: number;
  reason?: string | null;
}): number {
  console.log(input.type);
  console.log(input.quantity);
  if (input.type === MovementType.ADJUSTMENT) {
    if (input.quantity === 0)
      throw new BadRequestException('Adjustment cannot be zero.');
    if (!input.reason)
      throw new BadRequestException('A reason is required for adjustments.');
    return input.quantity;
  }
  if (input.quantity <= 0)
    throw new BadRequestException('Quantity must be greater than zero.');
  return input.type === MovementType.OUT ? -input.quantity : input.quantity;
}
