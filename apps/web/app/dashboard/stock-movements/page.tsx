import { redirect } from "next/navigation";
import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { MovementTabs } from "@/components/dashboard/stockMovements/MovementTabs";
import { MovementsView } from "@/components/dashboard/stockMovements/MovementsView";
import { Pagination } from "@/components/reusable/ui/Pagination";
import { ScrollToHighlight } from "@/components/reusable/ui/ScrollToHighlight";
import { nestJsEndpoints } from "@/lib/nestJsEndpoints";
import { helpers } from "@/lib/helpers";

const PAGE_SIZE = 10;

interface Props {
  searchParams: Promise<{
    productId?: string;
    type?: string;
    from?: string;
    to?: string;
    page?: string;
    highlight?: string;
  }>;
}

export default async function StockMovementsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const hasFilters = !!(sp.productId || sp.type || sp.from || sp.to);

  // Arrived from a notification: find which page holds the movement and land on it.
  // The page number goes into the URL, so clearing the highlight later keeps you there.
  if (sp.highlight && !sp.page && !hasFilters) {
    const res = await nestJsEndpoints.stockMovementsApi.getMovementPage(sp.highlight, PAGE_SIZE);
    if (res.success && res.data && res.data.page > 1) {
      const params = new URLSearchParams();
      Object.entries(sp).forEach(([key, value]) => value && params.set(key, value));
      params.set("page", String(res.data.page));
      redirect(`/dashboard/stock-movements?${params.toString()}`);
    }
  }

  const page = Math.max(1, Number(sp.page) || 1);

  const [currentUser, response, productsRes] = await Promise.all([
    helpers.getCurrentUserOrNull(),
    nestJsEndpoints.stockMovementsApi.getMovements({
      productId: sp.productId,
      type: sp.type,
      from: sp.from,
      to: sp.to,
      page,
      pageSize: PAGE_SIZE,
    }),
    nestJsEndpoints.productApi.getProductOptions(),
  ]);

  const canManage = currentUser?.role === "OWNER" || currentUser?.role === "MANAGER";
  const data = response.success && response.data ? response.data : null;
  const products = productsRes.success && productsRes.data ? productsRes.data : [];

  return (
    <>
      <DashboardTopbar title="Stock Movements" />
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <MovementTabs />
        {data ? (
          <>
            <MovementsView movements={data.items} products={products} hasFilters={hasFilters} canManage={canManage} />
            <Pagination page={data.page} pageSize={data.pageSize} total={data.total} />
          </>
        ) : (
          <p className="text-sm text-red-400">{response.message || "Could not load stock movements."}</p>
        )}

        <ScrollToHighlight elementId={sp.highlight ? `movement-${sp.highlight}` : undefined} />
      </div>
    </>
  );
}