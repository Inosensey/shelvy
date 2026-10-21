import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import {
  RecentMovementsList,
  type Movement,
} from "@/components/dashboard/RecentMovementsList";
import { QuickActions } from "@/components/dashboard/QuickActions";

const getOverviewData = async () => {
  const recentMovements: Movement[] = [
    {
      id: "1",
      productName: "Wireless Mouse",
      type: "OUT",
      quantity: 5,
      reason: "Order #1042",
      performedBy: "Jane",
      when: "12m ago",
    },
    {
      id: "2",
      productName: "USB-C Cable",
      type: "IN",
      quantity: 100,
      reason: "Restock",
      performedBy: "Owner",
      when: "2h ago",
    },
    {
      id: "3",
      productName: "Mechanical Keyboard",
      type: "ADJUSTMENT",
      quantity: 2,
      reason: "Damaged units",
      performedBy: "Jane",
      when: "5h ago",
    },
    {
      id: "4",
      productName: "Monitor Stand",
      type: "OUT",
      quantity: 3,
      reason: "Order #1038",
      performedBy: "Owner",
      when: "1d ago",
    },
    {
      id: "5",
      productName: "USB-C Cable",
      type: "OUT",
      quantity: 20,
      reason: "Order #1035",
      performedBy: "Jane",
      when: "1d ago",
    },
  ];

  return {
    stats: {
      totalProducts: 24,
      lowStockCount: 3,
      stockValue: 184500,
      suppliersCount: 6,
    },
    recentMovements,
  };
};

export default async function DashboardOverviewPage() {
  const { stats, recentMovements } = await getOverviewData();

  return (
    <>
      <DashboardTopbar title="Dashboard" />
      <main className="flex flex-col gap-6 px-4 py-8 sm:px-8">
        <StatsOverview {...stats} />
        <QuickActions />
        <RecentMovementsList movements={recentMovements} />
      </main>
    </>
  );
}
