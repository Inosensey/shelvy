"use client";

import { useState, useTransition } from "react";
import { AnimatePresence } from "motion/react";
import { Pencil, Plus, Trash2, Truck } from "lucide-react";
import { toast } from "sonner";
import { SearchInput } from "@/components/reusable/ui/SearchInput";
import { EmptyState } from "@/components/reusable/ui/EmptyState";
import { ConfirmDialog } from "@/components/reusable/ui/ConfirmDialog";
import { SupplierFormModal } from "./SupplierFormModal";
import { deleteSupplier } from "@/actions/supplierActions";

interface SuppliersViewProps {
  suppliers: Supplier[];
  search: string;
  canManage: boolean;
}

const dash = (v: string | null) => v || "—";

export function SuppliersView({
  suppliers,
  search,
  canManage,
}: SuppliersViewProps) {
  const [formTarget, setFormTarget] = useState<Supplier | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteSupplier(deleteTarget.id);
      if (result.success) {
        toast.success(result.message);
        setDeleteTarget(null);
      } else {
        toast.error(result.message);
      }
    });
  }

  const addButton = canManage && (
    <button
      type="button"
      onClick={() => setFormTarget("new")}
      className="inline-flex items-center gap-2 rounded-md bg-clay px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-clay/90"
    >
      <Plus className="h-4 w-4" /> Add supplier
    </button>
  );

  const rowActions = (s: Supplier) =>
    canManage && (
      <div className="flex justify-end gap-1">
        <button
          type="button"
          onClick={() => setFormTarget(s)}
          aria-label={`Edit ${s.name}`}
          className="rounded-md p-2 text-linen/50 transition-colors hover:bg-linen/5 hover:text-linen"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setDeleteTarget(s)}
          aria-label={`Delete ${s.name}`}
          className="rounded-md p-2 text-linen/50 transition-colors hover:bg-red-500/10 hover:text-red-400"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    );

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput placeholder="Search suppliers by name" />
        {addButton}
      </div>

      {suppliers.length === 0 ? (
        search ? (
          <EmptyState
            icon={Truck}
            title="No matching suppliers"
            description={`Nothing matches "${search}".`}
          />
        ) : (
          <EmptyState
            icon={Truck}
            title="No suppliers yet — add your first one"
            description="Suppliers let you track where each product comes from."
          >
            {addButton}
          </EmptyState>
        )
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-xl border border-linen/10 bg-surface md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-linen/10 text-xs uppercase tracking-wide text-linen/40">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Address</th>
                  <th className="px-4 py-3 text-right font-medium">Products</th>
                  {canManage && (
                    <th className="w-24 px-4 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-linen/5 last:border-0 hover:bg-linen/3"
                  >
                    <td className="px-4 py-3 font-medium text-linen">
                      {s.name}
                    </td>
                    <td className="px-4 py-3 text-linen/60">{dash(s.email)}</td>
                    <td className="px-4 py-3 text-linen/60">{dash(s.phone)}</td>
                    <td className="max-w-[16rem] truncate px-4 py-3 text-linen/60">
                      {dash(s.address)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-linen/80">
                      {s.productsCount}
                    </td>
                    {canManage && (
                      <td className="px-4 py-3">{rowActions(s)}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="flex flex-col gap-3 md:hidden">
            {suppliers.map((s) => (
              <li
                key={s.id}
                className="rounded-xl border border-linen/10 bg-surface p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-linen">{s.name}</p>
                    <p className="mt-0.5 text-xs text-linen/40">
                      {s.productsCount} products
                    </p>
                  </div>
                  {rowActions(s)}
                </div>
                <dl className="mt-3 space-y-1 text-sm text-linen/60">
                  <div>
                    <dt className="sr-only">Email</dt>
                    <dd>{dash(s.email)}</dd>
                  </div>
                  <div>
                    <dt className="sr-only">Phone</dt>
                    <dd>{dash(s.phone)}</dd>
                  </div>
                  <div>
                    <dt className="sr-only">Address</dt>
                    <dd>{dash(s.address)}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </>
      )}

      <AnimatePresence>
        {formTarget && (
          <SupplierFormModal
            key={formTarget === "new" ? "new" : formTarget.id}
            supplier={formTarget === "new" ? null : formTarget}
            onClose={() => setFormTarget(null)}
          />
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this supplier?"
        description={
          <>
            <span className="font-medium text-linen">{deleteTarget?.name}</span>{" "}
            will be removed. Its products are kept, but they will no longer have
            a supplier.
          </>
        }
        confirmLabel="Delete supplier"
        pendingLabel="Deleting…"
        pending={isPending}
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
