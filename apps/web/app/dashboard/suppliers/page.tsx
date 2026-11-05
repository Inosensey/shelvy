import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { SuppliersView } from "@/components/dashboard/suppliers/SuppliersView";
import { Pagination } from "@/components/reusable/ui/Pagination";
import { nestJsEndpoints } from "@/lib/nestJsEndpoints";
import { helpers } from "@/lib/helpers";

const PAGE_SIZE = 10;

interface SuppliersPageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function SuppliersPage({
  searchParams,
}: SuppliersPageProps) {
  const { search, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [currentUser, response] = await Promise.all([
    helpers.getCurrentUserOrNull(),
    nestJsEndpoints.supplierApi.getSuppliers({
      search,
      page,
      pageSize: PAGE_SIZE,
    }),
  ]);

  const canManage =
    currentUser?.role === "OWNER" || currentUser?.role === "MANAGER";
  const data = response.success && response.data ? response.data : null;

  return (
    <>
      <DashboardTopbar title="Suppliers" />
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        {data ? (
          <>
            <SuppliersView
              suppliers={data.items}
              search={search ?? ""}
              canManage={canManage}
            />
            <Pagination
              page={data.page}
              pageSize={data.pageSize}
              total={data.total}
            />
          </>
        ) : (
          <p className="text-sm text-red-400">
            {response.message || "Could not load suppliers."}
          </p>
        )}
      </div>
    </>
  );
}
