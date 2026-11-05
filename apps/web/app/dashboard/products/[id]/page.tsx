import { notFound } from "next/navigation";
import { ArrowDownToLine, ArrowUpFromLine, History, Layers } from "lucide-react";
import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { ProductHeader } from "@/components/dashboard/products/ProductHeader";
import { StockTrend } from "@/components/dashboard/products/StockTrend";
import { StatCard } from "@/components/dashboard/overview/StatCard";
import { Panel } from "@/components/dashboard/overview/Panel";
import { MovementsTable } from "@/components/dashboard/stockMovements/MovementsTable";
import { FilterSelect } from "@/components/reusable/ui/FilterSelect";
import { DateRangeFilter } from "@/components/reusable/ui/DateRangeFilter";
import { EmptyState } from "@/components/reusable/ui/EmptyState";
import { Pagination } from "@/components/reusable/ui/Pagination";
import { nestJsEndpoints } from "@/lib/nestJsEndpoints";
import { helpers } from "@/lib/helpers";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string; from?: string; to?: string; page?: string }>;
}

export default async function ProductDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const [currentUser, productRes, movementsRes, suppliersRes] = await Promise.all([
    helpers.getCurrentUserOrNull(),
    nestJsEndpoints.productApi.getProduct(id),
    nestJsEndpoints.stockMovementsApi.getMovements({ productId: id, type: sp.type, from: sp.from, to: sp.to, page, pageSize: 10 }),
    nestJsEndpoints.supplierApi.getSupplierOptions(),
  ]);

  if (!productRes.success || !productRes.data) {
    if (/not found/i.test(productRes.message ?? "")) notFound();
    return (
      <>
        <DashboardTopbar title="Product" />
        <p className="px-6 py-6 text-sm text-red-400">{productRes.message || "Could not load this product."}</p>
      </>
    );
  }

  const product = productRes.data;
  const movements = movementsRes.success && movementsRes.data ? movementsRes.data : null;
  const suppliers = suppliersRes.success && suppliersRes.data ? suppliersRes.data : [];
  const canManage = currentUser?.role === "OWNER" || currentUser?.role === "MANAGER";
  const hasFilters = !!(sp.type || sp.from || sp.to);
  const lowStock = product.stock <= product.lowStockThreshold;

  return (
    <>
      <DashboardTopbar title="Product" />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6">
        <ProductHeader product={product} suppliers={suppliers} canManage={canManage} />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="In stock"
            value={String(product.stock)}
            hint={product.stock <= 0 ? "Out of stock" : lowStock ? "Below alert level" : "Healthy"}
            icon={Layers}
            tone={lowStock && !product.archivedAt ? "warning" : "default"}
          />
          <StatCard label="Total in" value={String(product.stats.totalIn)} hint="Including opening stock" icon={ArrowDownToLine} />
          <StatCard label="Total out" value={String(product.stats.totalOut)} hint="Sales, usage, write-offs" icon={ArrowUpFromLine} />
          <StatCard label="Movements" value={String(product.stats.movementCount)} hint="Ledger entries" icon={History} />
        </div>

        <Panel title="Stock level">
          <StockTrend trend={product.trend} threshold={product.lowStockThreshold} />
        </Panel>

        <section>
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-display text-base text-linen">History</h2>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <FilterSelect
                paramName="type"
                allLabel="All types"
                options={[
                  { value: "IN", label: "In" }, { value: "OUT", label: "Out" },
                  { value: "ADJUSTMENT", label: "Adjustment" }, { value: "INITIAL", label: "Initial" },
                ]}
              />
              <DateRangeFilter />
            </div>
          </div>

          {!movements ? (
            <p className="text-sm text-red-400">{movementsRes.message || "Could not load history."}</p>
          ) : movements.items.length === 0 ? (
            <EmptyState icon={History}
              title={hasFilters ? "No matching movements" : "No history yet"}
              description={hasFilters ? "Try changing or clearing your filters." : "Stock changes for this product will appear here."} />
          ) : (
            <>
              <MovementsTable movements={movements.items} showProduct={false} />
              <Pagination page={movements.page} pageSize={movements.pageSize} total={movements.total} />
            </>
          )}
        </section>
      </div>
    </>
  );
}