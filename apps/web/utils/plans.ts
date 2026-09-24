export type PlanId = "FREE" | "PREMIUM" | "ENTERPRISE";

export interface Plan {
  id: PlanId;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "FREE",
    name: "Free",
    price: "₱0",
    period: "forever",
    description: "Get started with the basics.",
    features: ["Up to 50 SKUs", "1 team member", "Basic stock reports"],
  },
  {
    id: "PREMIUM",
    name: "Premium",
    price: "₱799",
    period: "/month",
    description: "For growing teams.",
    features: [
      "Unlimited SKUs",
      "Up to 10 team members",
      "Advanced reports",
      "Priority support",
    ],
    highlighted: true,
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    price: "₱2,499",
    period: "/month",
    description: "For larger operations.",
    features: [
      "Everything in Premium",
      "Unlimited team members",
      "Dedicated support",
      "Custom integrations",
    ],
  },
];
