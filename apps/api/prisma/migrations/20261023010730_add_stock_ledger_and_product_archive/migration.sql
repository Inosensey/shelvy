/*
  Warnings:

  - You are about to alter the column `price` on the `products` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(12,2)`.
  - You are about to drop the column `quantity` on the `stock_movements` table. All the data in the column will be lost.
  - Added the required column `delta` to the `stock_movements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organization_id` to the `stock_movements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stock_after` to the `stock_movements` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "MovementType" ADD VALUE 'INITIAL';

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "archived_at" TIMESTAMP(3),
ALTER COLUMN "price" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "stock_movements" DROP COLUMN "quantity",
ADD COLUMN     "delta" INTEGER NOT NULL,
ADD COLUMN     "organization_id" TEXT NOT NULL,
ADD COLUMN     "stock_after" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "products_organization_id_archived_at_idx" ON "products"("organization_id", "archived_at");

-- CreateIndex
CREATE INDEX "products_organization_id_supplier_id_idx" ON "products"("organization_id", "supplier_id");

-- CreateIndex
CREATE INDEX "stock_movements_organization_id_created_at_idx" ON "stock_movements"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "stock_movements_product_id_created_at_idx" ON "stock_movements"("product_id", "created_at");

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
