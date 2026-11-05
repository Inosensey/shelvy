"use client";

import { useState, useTransition } from "react";
import { AnimatePresence } from "motion/react";
import {
  ArchiveRestore,
  Archive,
  Package,
  Pencil,
  Plus,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { SearchInput } from "@/components/reusable/ui/SearchInput";
import { FilterSelect } from "@/components/reusable/ui/FilterSelect";
import { ToggleFilter } from "@/components/reusable/ui/ToggleFilter";
import { EmptyState } from "@/components/reusable/ui/EmptyState";
import { ConfirmDialog } from "@/components/reusable/ui/ConfirmDialog";
import { ProductFormModal } from "./ProductFormModal";
import { setProductArchived } from "@/actions/productActions";
import Link from "next/link";
import { ExportButton } from "@/components/reusable/ui/ExportButton";
import { ImportProductsModal } from "./ImportProductsModal";
const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

function StockBadge({ p }: { p: Product }) {
  if (p.stock <= 0)
    return (
      <span className="rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-medium text-red-400">
        Out of stock
      </span>
    );
  if (p.stock <= p.lowStockThreshold)
    return (
      <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-400">
        Low · {p.stock}
      </span>
    );
  return <span className="tabular-nums text-linen/80">{p.stock}</span>;
}

interface ProductsViewProps {
  products: Product[];
  suppliers: SupplierOption[];
  hasFilters: boolean;
  showingArchived: boolean;
  highlightId?: string;
  canManage: boolean;
}

export function ProductsView({
  products,
  suppliers,
  hasFilters,
  showingArchived,
  highlightId,
  canManage,
}: ProductsViewProps) {
  const [formTarget, setFormTarget] = useState<Product | "new" | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Product | null>(null);
  const [importing, setImporting] = useState(false);
  const [isPending, startTransition] = useTransition();

  function runArchive(p: Product, archived: boolean, done?: () => void) {
    startTransition(async () => {
      const result = await setProductArchived(p.id, archived);
      if (result.success) {
        toast.success(result.message);
        done?.();
      } else toast.error(result.message);
    });
  }

  const addButton = canManage && (
    <button
      type="button"
      onClick={() => setFormTarget("new")}
      className="inline-flex items-center gap-2 rounded-md bg-clay px-4 py-2 text-sm font-medium text-ink hover:bg-clay/90"
    >
      <Plus className="h-4 w-4" /> Add product
    </button>
  );

  const rowActions = (p: Product) =>
    canManage && (
      <div className="flex justify-end gap-1">
        {!p.archivedAt && (
          <button
            type="button"
            onClick={() => setFormTarget(p)}
            aria-label={`Edit ${p.name}`}
            className="rounded-md p-2 text-linen/50 hover:bg-linen/5 hover:text-linen"
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
        {p.archivedAt ? (
          <button
            type="button"
            onClick={() => runArchive(p, false)}
            disabled={isPending}
            aria-label={`Restore ${p.name}`}
            className="rounded-md p-2 text-linen/50 hover:bg-linen/5 hover:text-linen disabled:opacity-50"
          >
            <ArchiveRestore className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setArchiveTarget(p)}
            aria-label={`Archive ${p.name}`}
            className="rounded-md p-2 text-linen/50 hover:bg-red-500/10 hover:text-red-400"
          >
            <Archive className="h-4 w-4" />
          </button>
        )}
      </div>
    );

  const rowClass = (p: Product) =>
    `border-b border-linen/5 last:border-0 hover:bg-linen/[0.03] ${
      p.id === highlightId ? "bg-clay/10 ring-1 ring-inset ring-clay/40" : ""
    } ${p.archivedAt ? "opacity-60" : ""}`;

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <SearchInput placeholder="Search products by name" />
          <FilterSelect
            paramName="supplierId"
            allLabel="All suppliers"
            options={[
              { value: "none", label: "No supplier" },
              ...suppliers.map((s) => ({ value: s.id, label: s.name })),
            ]}
          />
          <div className="flex gap-2">
            <ToggleFilter paramName="lowStock" label="Low stock" />
            <ToggleFilter paramName="archived" label="Archived" />
          </div>
        </div>
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <ExportButton resource="products" />
            <button
              type="button"
              onClick={() => setImporting(true)}
              className="inline-flex items-center gap-2 rounded-md border border-linen/10 px-4 py-2 text-sm text-linen/80 hover:bg-linen/5"
            >
              <Upload className="h-4 w-4" /> Import CSV
            </button>
            {addButton}
          </div>
        )}
      </div>

      {products.length === 0 ? (
        hasFilters ? (
          <EmptyState
            icon={Package}
            title="No matching products"
            description="Try changing or clearing your filters."
          />
        ) : (
          <EmptyState
            icon={Package}
            title="No products yet — add your first one"
            description="Products are what you stock, price and track."
          >
            {addButton}
          </EmptyState>
        )
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden overflow-hidden rounded-xl border border-linen/10 bg-surface md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-linen/10 text-xs uppercase tracking-wide text-linen/40">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Supplier</th>
                  <th className="px-4 py-3 text-right font-medium">Price</th>
                  <th className="px-4 py-3 text-right font-medium">Stock</th>
                  {canManage && (
                    <th className="w-24 px-4 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} id={`product-${p.id}`} className={rowClass(p)}>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/products/${p.id}`}
                        className="font-medium text-linen hover:text-clay hover:underline"
                      >
                        {p.name}
                        {p.sku && (
                          <p className="font-mono text-xs text-linen/40">
                            {p.sku}
                          </p>
                        )}
                      </Link>
                      {p.description && (
                        <p className="max-w-xs truncate text-xs text-linen/40">
                          {p.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-linen/60">
                      {p.supplier?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-linen/80">
                      {peso.format(p.price)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <StockBadge p={p} />
                    </td>
                    {canManage && (
                      <td className="px-4 py-3">{rowActions(p)}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <ul className="flex flex-col gap-3 md:hidden">
            {products.map((p) => (
              <li
                key={p.id}
                id={`product-${p.id}`}
                className={`rounded-xl border border-linen/10 bg-surface p-4 ${rowClass(p)}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/products/${p.id}`}
                      className="font-medium text-linen hover:text-clay hover:underline"
                    >
                      {p.name}
                    </Link>
                    <p className="text-xs text-linen/40">
                      {p.supplier?.name ?? "No supplier"}
                    </p>
                  </div>
                  {rowActions(p)}
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="tabular-nums text-linen/80">
                    {peso.format(p.price)}
                  </span>
                  <StockBadge p={p} />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <AnimatePresence>
        {formTarget && (
          <ProductFormModal
            key={formTarget === "new" ? "new" : formTarget.id}
            product={formTarget === "new" ? null : formTarget}
            suppliers={suppliers}
            onClose={() => setFormTarget(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {importing && (
          <ImportProductsModal onClose={() => setImporting(false)} />
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!archiveTarget}
        title="Archive this product?"
        description={
          <>
            <span className="font-medium text-linen">
              {archiveTarget?.name}
            </span>{" "}
            will be hidden from the main list. Its stock history is kept, and
            you can restore it anytime from the Archived filter.
          </>
        }
        confirmLabel="Archive"
        pendingLabel="Archiving…"
        pending={isPending}
        onConfirm={() =>
          archiveTarget &&
          runArchive(archiveTarget, true, () => setArchiveTarget(null))
        }
        onCancel={() => setArchiveTarget(null)}
      />
    </>
  );
}
