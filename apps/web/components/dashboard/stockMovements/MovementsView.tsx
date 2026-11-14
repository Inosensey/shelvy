"use client";

import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { ArrowLeftRight, Plus } from "lucide-react";
import { FilterSelect } from "@/components/reusable/ui/FilterSelect";
import { DateRangeFilter } from "@/components/reusable/ui/DateRangeFilter";
import { EmptyState } from "@/components/reusable/ui/EmptyState";
import { MovementFormModal } from "./MovementFormModal";
import { MovementsTable } from "./MovementsTable";
import { ExportButton } from "@/components/reusable/ui/ExportButton";

interface Props {
  movements: StockMovement[];
  products: ProductOption[];
  hasFilters: boolean;
  canManage: boolean;
}

export function MovementsView({
  movements,
  products,
  hasFilters,
  canManage,
}: Props) {
  const [open, setOpen] = useState(false);

  const actionButton = (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="inline-flex items-center gap-2 rounded-md bg-clay px-4 py-2 text-sm font-medium text-ink hover:bg-clay/90"
    >
      <Plus className="h-4 w-4" />{" "}
      {canManage ? "Record movement" : "Request stock change"}
    </button>
  );

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <FilterSelect
            paramName="productId"
            allLabel="All products"
            options={products.map((p) => ({ value: p.id, label: p.name }))}
          />
          <FilterSelect
            paramName="type"
            allLabel="All types"
            options={[
              { value: "IN", label: "In" },
              { value: "OUT", label: "Out" },
              { value: "ADJUSTMENT", label: "Adjustment" },
              { value: "INITIAL", label: "Initial" },
            ]}
          />
          <DateRangeFilter />
        </div>
        <div className="flex gap-2">
          {canManage && <ExportButton resource="stock-movements" />}
          {actionButton}
        </div>
      </div>

      {movements.length === 0 ? (
        hasFilters ? (
          <EmptyState
            icon={ArrowLeftRight}
            title="No matching movements"
            description="Try changing or clearing your filters."
          />
        ) : (
          <EmptyState
            icon={ArrowLeftRight}
            title="No stock movements yet"
            description="Every change to a product's stock shows up here."
          >
            {actionButton}
          </EmptyState>
        )
      ) : (
        <>
          <MovementsTable movements={movements} />
        </>
      )}

      <AnimatePresence>
        {open && (
          <MovementFormModal
            products={products}
            mode={canManage ? "record" : "request"}
            onClose={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
