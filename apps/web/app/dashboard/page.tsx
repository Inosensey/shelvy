import { LogoutButton } from "@/components/dashboard/LogoutButton";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { MovementsChart, type MovementDay } from "@/components/dashboard/MovementsChart";
import { StockLevelBars, type StockLevel } from "@/components/dashboard/StockLevelBars";
import { RecentMovementsTable, type Movement } from "@/components/dashboard/RecentMovementsTable";
import { nestJsEndpoints } from "@/lib/nestJsEndpoints";

async function getDashboardData() {
  const movementsByDay: MovementDay[] = [
    { label: "Mon", stockIn: 40, stockOut: 22 },
    { label: "Tue", stockIn: 18, stockOut: 30 },
    { label: "Wed", stockIn: 55, stockOut: 25 },
    { label: "Thu", stockIn: 20, stockOut: 15 },
    { label: "Fri", stockIn: 35, stockOut: 40 },
    { label: "Sat", stockIn: 10, stockOut: 12 },
    { label: "Sun", stockIn: 5, stockOut: 8 },
  ];

  const stockLevels: StockLevel[] = [
    { id: "1", name: "Wireless Mouse", stock: 12, lowStockThreshold: 20, maxScale: 200 },
    { id: "2", name: "USB-C Cable", stock: 180, lowStockThreshold: 50, maxScale: 200 },
    { id: "3", name: "Mechanical Keyboard", stock: 8, lowStockThreshold: 15, maxScale: 200 },
    { id: "4", name: "Monitor Stand", stock: 64, lowStockThreshold: 20, maxScale: 200 },
  ];

  const recentMovements: Movement[] = [
    { id: "1", productName: "Wireless Mouse", type: "OUT", quantity: 5, reason: "Order #1042", who: "Jane", when: "12m ago" },
    { id: "2", productName: "USB-C Cable", type: "IN", quantity: 100, reason: "Restock", who: "Owner", when: "2h ago" },
    { id: "3", productName: "Mechanical Keyboard", type: "ADJUSTMENT", quantity: 2, reason: "Damaged units", who: "Jane", when: "5h ago" },
    { id: "4", productName: "Monitor Stand", type: "OUT", quantity: 3, reason: "Order #1038", who: "Owner", when: "1d ago" },
  ];

  const userInfo = await nestJsEndpoints.userApi.getMeInfo();

  console.log("User Info:", userInfo);

  return {
    stats: {
      totalProducts: 24,
      lowStockCount: stockLevels.filter((p) => p.stock <= p.lowStockThreshold).length,
      stockValue: 184500,
      movementsThisWeek: movementsByDay.reduce((sum, d) => sum + d.stockIn + d.stockOut, 0),
    },
    movementsByDay,
    stockLevels,
    recentMovements,
  };
}

export default async function DashboardPage() {
  const { stats, movementsByDay, stockLevels, recentMovements } = await getDashboardData();

  return (
    <div className="min-h-screen bg-ink">
      <header className="border-b border-linen/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-8">
          <span className="font-display text-xl italic text-linen">Shelvy</span>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-8">
        <StatsOverview {...stats} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <MovementsChart data={movementsByDay} />
          <StockLevelBars products={stockLevels} />
        </div>
        <RecentMovementsTable movements={recentMovements} />
      </main>
    </div>
  );
}