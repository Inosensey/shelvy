"use client";

import { Check } from "lucide-react";
import { PLANS, type PlanId } from "@/utils/plans";

interface PlanSelectorProps {
  value: PlanId;
  onChange: (plan: PlanId) => void;
}

export function PlanSelector({ value, onChange }: PlanSelectorProps) {
  return (
    <div role="radiogroup" aria-label="Choose a plan" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {PLANS.map((plan) => {
        const selected = value === plan.id;
        return (
          <label
            key={plan.id}
            className={`relative flex cursor-pointer flex-col rounded-xl border p-5 transition-colors duration-150 ${
              selected
                ? "border-clay bg-clay/5"
                : "border-linen/15 hover:border-linen/30"
            }`}
          >
            <input
              type="radio"
              name="plan"
              value={plan.id}
              checked={selected}
              onChange={() => onChange(plan.id)}
              className="sr-only"
            />

            {plan.highlighted && (
              <span className="absolute -top-2.5 left-5 rounded-full bg-clay px-2 py-0.5 text-[11px] font-medium text-ink">
                Most popular
              </span>
            )}

            <div className="flex items-center justify-between">
              <span className="font-display text-lg text-linen">{plan.name}</span>
              <span
                aria-hidden
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                  selected ? "border-clay bg-clay" : "border-linen/30"
                }`}
              >
                {selected && <span className="h-1.5 w-1.5 rounded-full bg-ink" />}
              </span>
            </div>

            <p className="mt-1 flex items-baseline gap-1">
              <span className="font-display text-2xl text-linen">{plan.price}</span>
              <span className="text-xs text-linen/50">{plan.period}</span>
            </p>

            <p className="mt-2 text-xs text-linen/55">{plan.description}</p>

            <ul className="mt-4 flex flex-col gap-1.5">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-1.5 text-xs text-linen/70">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-clay" strokeWidth={2.5} />
                  {feature}
                </li>
              ))}
            </ul>
          </label>
        );
      })}
    </div>
  );
}
