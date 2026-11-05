"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence } from "motion/react";
import { ArrowLeft, ArrowLeftRight, Pencil } from "lucide-react";
import { ProductFormModal } from "./ProductFormModal";
import { MovementFormModal } from "../stockMovements/MovementFormModal";

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});
const added = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeZone: "Asia/Manila",
});

interface Props {
  product: ProductDetail;
  suppliers: SupplierOption[];
  canManage: boolean;
}

export function ProductHeader({ product, suppliers, canManage }: Props) {
  const [editing, setEditing] = useState(false);
  const [moving, setMoving] = useState(false);
  const archived = !!product.archivedAt;

  return (
    <>
      <Link
        href="/dashboard/products"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-linen/50 hover:text-linen"
      >
        <ArrowLeft className="h-4 w-4" /> Products
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl text-linen">{product.name}</h1>
            {archived && (
              <span className="rounded-full bg-linen/10 px-2.5 py-0.5 text-xs font-medium text-linen/60">
                Archived
              </span>
            )}
          </div>
          {product.description && (
            <p className="mt-1 max-w-2xl text-sm text-linen/60">
              {product.description}
            </p>
          )}
          {product.sku && (
            <div className="flex gap-1.5">
              <dt className="text-linen/40">SKU</dt>
              <dd className="font-mono text-linen/80">{product.sku}</dd>
            </div>
          )}
          <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <div className="flex gap-1.5">
              <dt className="text-linen/40">Price</dt>
              <dd className="tabular-nums text-linen/80">
                {peso.format(product.price)}
              </dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="text-linen/40">Supplier</dt>
              <dd className="text-linen/80">{product.supplier?.name ?? "—"}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="text-linen/40">Alert at</dt>
              <dd className="tabular-nums text-linen/80">
                {product.lowStockThreshold}
              </dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="text-linen/40">Added</dt>
              <dd className="text-linen/80">
                {added.format(new Date(product.createdAt))}
              </dd>
            </div>
          </dl>
        </div>

        {!archived && (
          <div className="flex shrink-0 gap-2">
            {canManage && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-2 rounded-md border border-linen/10 px-4 py-2 text-sm text-linen/80 hover:bg-linen/5"
              >
                <Pencil className="h-4 w-4" /> Edit
              </button>
            )}
            <button
              type="button"
              onClick={() => setMoving(true)}
              className="inline-flex items-center gap-2 rounded-md bg-clay px-4 py-2 text-sm font-medium text-ink hover:bg-clay/90"
            >
              <ArrowLeftRight className="h-4 w-4" />{" "}
              {canManage ? "Record movement" : "Request stock change"}
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {editing && (
          <ProductFormModal
            product={product}
            suppliers={suppliers}
            onClose={() => setEditing(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {moving && (
          <MovementFormModal
            products={[
              {
                id: product.id,
                name: product.name,
                stock: product.stock,
                sku: product.sku,
              },
            ]}
            defaultProductId={product.id}
            mode={canManage ? "record" : "request"}
            onClose={() => setMoving(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
