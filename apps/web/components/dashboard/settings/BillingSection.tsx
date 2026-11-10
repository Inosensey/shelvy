import { nestJsEndpoints } from "@/lib/nestJsEndpoints";
import { BillingPanel } from "./BillingPanel";

export async function BillingSection() {
  const res = await nestJsEndpoints.stripeApi.getBilling();
  if (!res.success || !res.data) {
    return <p className="text-sm text-red-400">{res.message || "Could not load billing."}</p>;
  }
  return <BillingPanel billing={res.data} />;
}