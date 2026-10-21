import { Package } from "lucide-react";
import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { ComingSoon } from "@/components/dashboard/ComingSoon";

export default async function ProductsPage() {
  return (
    <>
      <DashboardTopbar title="Products" />
      <ComingSoon
        icon={Package}
        description="Product list, add/edit forms, and per-product supplier assignment go here."
      />
    </>
  );
}