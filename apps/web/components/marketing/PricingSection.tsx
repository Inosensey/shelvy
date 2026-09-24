import Link from "next/link";
import { Check } from "lucide-react";
import { PLANS } from "@/utils/plans";

export function PricingSection() {
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-4 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-xl text-center">
        <h2 className="font-display text-3xl text-linen">Simple, transparent pricing</h2>
        <p className="mt-3 text-linen/55">Start free. Upgrade when your team grows.</p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`relative flex flex-col rounded-xl border p-6 ${
              plan.highlighted ? "border-clay bg-clay/5" : "border-linen/10 bg-surface"
            }`}
          >
            {plan.highlighted && (
              <span className="absolute -top-2.5 left-6 rounded-full bg-clay px-2 py-0.5 text-[11px] font-medium text-ink">
                Most popular
              </span>
            )}

            <span className="font-display text-lg text-linen">{plan.name}</span>
            <p className="mt-1 flex items-baseline gap-1">
              <span className="font-display text-3xl text-linen">{plan.price}</span>
              <span className="text-xs text-linen/50">{plan.period}</span>
            </p>
            <p className="mt-2 text-xs text-linen/55">{plan.description}</p>

            <ul className="mt-5 flex flex-1 flex-col gap-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-1.5 text-sm text-linen/70">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-clay" strokeWidth={2.5} />
                  {feature}
                </li>
              ))}
            </ul>

            <Link
              href={`/register?plan=${plan.id}`}
              className={`mt-6 rounded-md px-4 py-2 text-center text-sm font-medium transition-colors ${
                plan.highlighted
                  ? "bg-clay text-ink hover:bg-clay/90"
                  : "border border-linen/20 text-linen hover:bg-linen/5"
              }`}
            >
              {plan.id === "FREE" ? "Start free" : "Choose plan"}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
