import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { ProductsView } from "@/components/dashboard/products/ProductsView";
import { Pagination } from "@/components/reusable/ui/Pagination";
import { nestJsEndpoints } from "@/lib/nestJsEndpoints";
import { helpers } from "@/lib/helpers";
import { ScrollToHighlight } from "@/components/reusable/ui/ScrollToHighlight";

const PAGE_SIZE = 10;

interface ProductsPageProps {
  searchParams: Promise<{
    search?: string;
    supplierId?: string;
    lowStock?: string;
    archived?: string;
    page?: string;
    highlight?: string;
  }>;
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const lowStock = sp.lowStock === "true";
  const archived = sp.archived === "true";

  const [currentUser, products, suppliersRes] = await Promise.all([
    helpers.getCurrentUserOrNull(),
    nestJsEndpoints.productApi.getProducts({
      search: sp.search,
      supplierId: sp.supplierId,
      lowStock,
      archived,
      page,
      pageSize: PAGE_SIZE,
    }),
    nestJsEndpoints.supplierApi.getSupplierOptions(),
  ]);

  const canManage =
    currentUser?.role === "OWNER" || currentUser?.role === "MANAGER";
  const productResponse = products.success && products.data ? products : null;
  const suppliers =
    suppliersRes.success && suppliersRes.data ? suppliersRes.data : [];
  return (
    <>
      <DashboardTopbar title="Products" />
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        {productResponse && productResponse.data ? (
          <>
            <ProductsView
              products={productResponse.data.items}
              suppliers={suppliers}
              hasFilters={
                !!(sp.search || sp.supplierId || lowStock || archived)
              }
              showingArchived={archived}
              highlightId={sp.highlight}
              canManage={canManage}
            />
            <Pagination
              page={productResponse.data.page}
              pageSize={productResponse.data.pageSize}
              total={productResponse.data.total}
            />
            <ScrollToHighlight
              elementId={sp.highlight ? `product-${sp.highlight}` : undefined}
            />
          </>
        ) : (
          <p className="text-sm text-red-400">
            {products.message || "Could not load products."}
          </p>
        )}
      </div>
    </>
  );
}
