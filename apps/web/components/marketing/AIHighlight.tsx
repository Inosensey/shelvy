import { Sparkles } from "lucide-react";

export function AIHighlight() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-8 sm:py-20">
      <div className="rounded-xl border border-linen/10 bg-surface p-6 sm:p-10">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-clay" strokeWidth={2} />
          <span className="text-xs font-medium uppercase tracking-wide text-clay">
            Powered by Claude
          </span>
        </div>

        <h2 className="mt-3 font-display text-2xl text-linen sm:text-3xl">
          Never write a product description again
        </h2>
        <p className="mt-2 max-w-lg text-sm text-linen/55">
          Give it a product name and category. Claude writes the rest.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-linen/10 bg-ink/40 p-4">
            <p className="text-xs font-medium text-linen/40">You provide</p>
            <p className="mt-2 text-sm text-linen">
              "Stainless Steel French Press" -- Kitchenware
            </p>
          </div>
          <div className="rounded-lg border border-clay/30 bg-ink/40 p-4">
            <p className="text-xs font-medium text-clay">Claude generates</p>
            <p className="mt-2 text-sm leading-relaxed text-linen/80">
              A double-walled stainless steel French press that keeps coffee hot
              longer without a glass carafe to worry about breaking. Simple to
              clean, built to last, ideal for daily brewing at home or in the office.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
