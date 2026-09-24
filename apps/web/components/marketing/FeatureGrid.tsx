import { ShieldCheck, CreditCard, Building2, Package, History, AlertTriangle } from "lucide-react";
import type { ComponentType } from "react";

interface Feature {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: ShieldCheck,
    title: "Role-based access",
    description:
      "Owner, Manager, and Staff roles with different permissions. Owners invite teammates by email.",
  },
  {
    icon: CreditCard,
    title: "Subscription billing",
    description:
      "Stripe-backed Free/Premium/Enterprise tiers, prorated cancellations, and automatic retry on failed payments.",
  },
  {
    icon: Building2,
    title: "Multi-tenant organizations",
    description:
      "Each Owner runs one Organization with full data isolation between tenants.",
  },
  {
    icon: Package,
    title: "Products & suppliers",
    description:
      "Full CRUD on products, each with price, stock, and a low-stock threshold. Suppliers track which products they carry.",
  },
  {
    icon: History,
    title: "Immutable audit trail",
    description:
      "Every stock change -- in, out, or adjustment -- is recorded, never edited. CQRS keeps the history append-only.",
  },
  {
    icon: AlertTriangle,
    title: "Low stock alerts",
    description:
      "Owners and Managers get notified the moment a product drops below its threshold.",
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-xl text-center">
        <h2 className="font-display text-3xl text-linen">Everything stock tracking needs</h2>
        <p className="mt-3 text-linen/55">
          Not just a product list -- a full system for teams managing real inventory.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="rounded-xl border border-linen/10 bg-surface p-5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-clay/15 text-clay">
              <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
            </div>
            <h3 className="mt-4 font-display text-lg text-linen">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-linen/55">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
