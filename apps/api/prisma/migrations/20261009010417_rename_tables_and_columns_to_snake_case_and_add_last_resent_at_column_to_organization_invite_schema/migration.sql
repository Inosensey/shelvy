-- 1. Safely add the new value to your existing Enum
ALTER TYPE "InviteStatus" ADD VALUE 'EXPIRED';

-- 2. Rename the old tables directly to snake_case so your rows survive
ALTER TABLE "Organization" RENAME TO "organizations";
ALTER TABLE "OrganizationInvite" RENAME TO "organization_invites";
ALTER TABLE "User" RENAME TO "users";
ALTER TABLE "UserInfo" RENAME TO "users_info";
ALTER TABLE "Product" RENAME TO "products";
ALTER TABLE "Supplier" RENAME TO "suppliers";
ALTER TABLE "StockMovement" RENAME TO "stock_movements";

-- 3. Rename specific table columns from camelCase to snake_case
-- organizations
ALTER TABLE "organizations" RENAME COLUMN "ownerId" TO "owner_id";
ALTER TABLE "organizations" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "organizations" RENAME COLUMN "updatedAt" TO "updated_at";

-- organization_invites
ALTER TABLE "organization_invites" RENAME COLUMN "organizationId" TO "organization_id";
ALTER TABLE "organization_invites" RENAME COLUMN "invitedById" TO "invited_by_id";
ALTER TABLE "organization_invites" RENAME COLUMN "expiresAt" TO "expires_at";
ALTER TABLE "organization_invites" ADD COLUMN "last_resent_at" TIMESTAMP(3);
ALTER TABLE "organization_invites" RENAME COLUMN "acceptedAt" TO "accepted_at";
ALTER TABLE "organization_invites" RENAME COLUMN "createdAt" TO "created_at";

-- users
ALTER TABLE "users" RENAME COLUMN "subscriptionPlan" TO "subscription_plan";
ALTER TABLE "users" RENAME COLUMN "authProvider" TO "auth_provider";
ALTER TABLE "users" RENAME COLUMN "organizationId" TO "organization_id";
ALTER TABLE "users" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "users" RENAME COLUMN "updatedAt" TO "updated_at";

-- users_info
ALTER TABLE "users_info" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "users_info" RENAME COLUMN "firstName" TO "first_name";
ALTER TABLE "users_info" RENAME COLUMN "middleName" TO "middle_name";
ALTER TABLE "users_info" RENAME COLUMN "lastName" TO "last_name";
ALTER TABLE "users_info" RENAME COLUMN "birthDate" TO "birth_date";
ALTER TABLE "users_info" RENAME COLUMN "postalCode" TO "postal_code";
ALTER TABLE "users_info" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "users_info" RENAME COLUMN "updatedAt" TO "updated_at";

-- products
ALTER TABLE "products" RENAME COLUMN "lowStockThreshold" TO "low_stock_threshold";
ALTER TABLE "products" RENAME COLUMN "organizationId" TO "organization_id";
ALTER TABLE "products" RENAME COLUMN "supplierId" TO "supplier_id";
ALTER TABLE "products" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "products" RENAME COLUMN "updatedAt" TO "updated_at";

-- suppliers
ALTER TABLE "suppliers" RENAME COLUMN "organizationId" TO "organization_id";
ALTER TABLE "suppliers" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "suppliers" RENAME COLUMN "updatedAt" TO "updated_at";

-- stock_movements
ALTER TABLE "stock_movements" RENAME COLUMN "productId" TO "product_id";
ALTER TABLE "stock_movements" RENAME COLUMN "performedById" TO "performed_by_id";
ALTER TABLE "stock_movements" RENAME COLUMN "createdAt" TO "created_at";


-- 4. Update the constraints and primary keys to point to the new structures
ALTER TABLE "organizations" RENAME CONSTRAINT "Organization_pkey" TO "organizations_pkey";
ALTER TABLE "organizations" RENAME CONSTRAINT "Organization_ownerId_fkey" TO "organizations_owner_id_fkey";

ALTER TABLE "organization_invites" RENAME CONSTRAINT "OrganizationInvite_pkey" TO "organization_invites_pkey";
ALTER TABLE "organization_invites" RENAME CONSTRAINT "OrganizationInvite_organizationId_fkey" TO "organization_invites_organization_id_fkey";
ALTER TABLE "organization_invites" RENAME CONSTRAINT "OrganizationInvite_invitedById_fkey" TO "organization_invites_invited_by_id_fkey";

ALTER TABLE "users" RENAME CONSTRAINT "User_pkey" TO "users_pkey";
ALTER TABLE "users" RENAME CONSTRAINT "User_organizationId_fkey" TO "users_organization_id_fkey";

ALTER TABLE "users_info" RENAME CONSTRAINT "UserInfo_pkey" TO "users_info_pkey";
ALTER TABLE "users_info" RENAME CONSTRAINT "UserInfo_userId_fkey" TO "users_info_user_id_fkey";

ALTER TABLE "products" RENAME CONSTRAINT "Product_pkey" TO "products_pkey";
ALTER TABLE "products" RENAME CONSTRAINT "Product_organizationId_fkey" TO "products_organization_id_fkey";
ALTER TABLE "products" RENAME CONSTRAINT "Product_supplierId_fkey" TO "products_supplier_id_fkey";

ALTER TABLE "suppliers" RENAME CONSTRAINT "Supplier_pkey" TO "suppliers_pkey";
ALTER TABLE "suppliers" RENAME CONSTRAINT "Supplier_organizationId_fkey" TO "suppliers_organization_id_fkey";

ALTER TABLE "stock_movements" RENAME CONSTRAINT "StockMovement_pkey" TO "stock_movements_pkey";
ALTER TABLE "stock_movements" RENAME CONSTRAINT "StockMovement_productId_fkey" TO "stock_movements_product_id_fkey";
ALTER TABLE "stock_movements" RENAME CONSTRAINT "StockMovement_performedById_fkey" TO "stock_movements_performed_by_id_fkey";

-- 5. Corrected PostgreSQL Index Renames (Table name is NOT specified before the new index name)
ALTER INDEX "Organization_ownerId_key" RENAME TO "organizations_owner_id_key";
ALTER INDEX "OrganizationInvite_token_key" RENAME TO "organization_invites_token_key";
ALTER INDEX "OrganizationInvite_email_idx" RENAME TO "organization_invites_email_idx";
ALTER INDEX "User_email_key" RENAME TO "users_email_key";
ALTER INDEX "UserInfo_userId_key" RENAME TO "users_info_user_id_key";
