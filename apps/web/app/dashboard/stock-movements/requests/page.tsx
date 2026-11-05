import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { MovementTabs } from "@/components/dashboard/stockMovements/MovementTabs";
import { RequestsView } from "@/components/dashboard/stockMovements/RequestsView";
import { Pagination } from "@/components/reusable/ui/Pagination";
import { nestJsEndpoints } from "@/lib/nestJsEndpoints";
import { helpers } from "@/lib/helpers";
import { ScrollToHighlight } from "@/components/reusable/ui/ScrollToHighlight";

interface Props {
  searchParams: Promise<{ status?: string; page?: string; highlight?: string }>;
}

export default async function RequestsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const [currentUser, response] = await Promise.all([
    helpers.getCurrentUserOrNull(),
    nestJsEndpoints.stockMovementRequestApi.getRequests({
      status: sp.status,
      page,
      pageSize: 10,
    }),
  ]);

  const isManager =
    currentUser?.role === "OWNER" || currentUser?.role === "MANAGER";
  const data = response.success && response.data ? response.data : null;

  return (
    <>
      <DashboardTopbar title="Stock Movements" />
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <MovementTabs />
        {data ? (
          <>
            <RequestsView
              requests={data.items}
              isManager={isManager}
              currentUserId={currentUser?.id ?? ""} // adjust to your user shape
              hasFilters={!!sp.status}
            />
            <Pagination
              page={data.page}
              pageSize={data.pageSize}
              total={data.total}
            />
            <ScrollToHighlight
              elementId={sp.highlight ? `request-${sp.highlight}` : undefined}
            />
          </>
        ) : (
          <p className="text-sm text-red-400">
            {response.message || "Could not load requests."}
          </p>
        )}
      </div>
    </>
  );
}
