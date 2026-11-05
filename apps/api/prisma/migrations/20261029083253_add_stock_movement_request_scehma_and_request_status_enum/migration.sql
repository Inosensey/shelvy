-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'MOVEMENT_REQUESTED';
ALTER TYPE "NotificationType" ADD VALUE 'MOVEMENT_DECIDED';

-- CreateTable
CREATE TABLE "stock_movement_requests" (
    "id" TEXT NOT NULL,
    "type" "MovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT,
    "note" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "decision_note" TEXT,
    "decided_at" TIMESTAMP(3),
    "organization_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "requested_by_id" TEXT NOT NULL,
    "decided_by_id" TEXT,
    "movement_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_movement_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stock_movement_requests_movement_id_key" ON "stock_movement_requests"("movement_id");

-- CreateIndex
CREATE INDEX "stock_movement_requests_organization_id_status_created_at_idx" ON "stock_movement_requests"("organization_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "stock_movement_requests_requested_by_id_created_at_idx" ON "stock_movement_requests"("requested_by_id", "created_at");

-- AddForeignKey
ALTER TABLE "stock_movement_requests" ADD CONSTRAINT "stock_movement_requests_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement_requests" ADD CONSTRAINT "stock_movement_requests_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement_requests" ADD CONSTRAINT "stock_movement_requests_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement_requests" ADD CONSTRAINT "stock_movement_requests_decided_by_id_fkey" FOREIGN KEY ("decided_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement_requests" ADD CONSTRAINT "stock_movement_requests_movement_id_fkey" FOREIGN KEY ("movement_id") REFERENCES "stock_movements"("id") ON DELETE SET NULL ON UPDATE CASCADE;
