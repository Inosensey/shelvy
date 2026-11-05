import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { TableSkeleton } from "@/components/reusable/ui/TableSkeleton";

export default function Loading() {
  return (
    <>
      <DashboardTopbar title="Suppliers" />
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <TableSkeleton columns={6} />
      </div>
    </>
  );
}