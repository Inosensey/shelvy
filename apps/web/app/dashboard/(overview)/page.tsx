import { AlertTriangle, ClipboardList, Package, Wallet } from "lucide-react";
import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { StatCard } from "@/components/dashboard/overview/StatCard";
import { LowStockPanel } from "@/components/dashboard/overview/LowStockPanel";
import { RecentMovementsPanel } from "@/components/dashboard/overview/RecentMovementPanel";
import { ActivityChart } from "@/components/dashboard/overview/ActivityChart";
import { nestJsEndpoints } from "@/lib/nestJsEndpoints";
import { helpers } from "@/lib/helpers";

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});
const num = new Intl.NumberFormat("en-PH");

export default async function DashboardPage() {
  const [currentUser, response] = await Promise.all([
    helpers.getCurrentUserOrNull(),
    nestJsEndpoints.dashboardApi.getOverview(),
  ]);

  const data = response.success && response.data ? response.data : null;
  const isStaff = currentUser?.role === "STAFF";

  return (
    <>
      <DashboardTopbar title="Overview" />
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        {!data ? (
          <p className="text-sm text-red-400">
            {response.message || "Could not load the overview."}
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard
                label="Active products"
                value={num.format(data.kpis.activeProducts)}
                hint={`${num.format(data.kpis.totalUnits)} units in stock`}
                icon={Package}
                href="/dashboard/products"
              />
              <StatCard
                label="Stock value"
                value={peso.format(data.kpis.stockValue)}
                hint="Price × units on hand"
                icon={Wallet}
              />
              <StatCard
                label="Low stock"
                value={num.format(data.kpis.lowStockCount)}
                hint={
                  data.kpis.lowStockCount === 0
                    ? "All good"
                    : "Needs restocking"
                }
                icon={AlertTriangle}
                tone={data.kpis.lowStockCount > 0 ? "warning" : "default"}
                href="/dashboard/products?lowStock=true"
              />
              <StatCard
                label={isStaff ? "My pending requests" : "Pending requests"}
                value={num.format(data.kpis.pendingRequests)}
                hint={isStaff ? "Waiting for a manager" : "Waiting for review"}
                icon={ClipboardList}
                href="/dashboard/stock-movements/requests?status=PENDING"
              />
            </div>

            <ActivityChart data={data.activity} />

            <div className="grid gap-4 lg:grid-cols-2">
              <LowStockPanel items={data.lowStock} />
              <RecentMovementsPanel movements={data.recentMovements} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
