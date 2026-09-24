export interface StockLevel {
  id: string;
  name: string;
  stock: number;
  lowStockThreshold: number;
  maxScale: number; // reference point for the bar's full width, e.g. highest stock in the set
}

export function StockLevelBars({ products }: { products: StockLevel[] }) {
  return (
    <section className="rounded-xl border border-linen/10 bg-surface p-5">
      <h2 className="font-display text-lg text-linen">Stock Levels</h2>

      <div className="mt-5 flex flex-col gap-4">
        {products.map((product) => {
          const isLow = product.stock <= product.lowStockThreshold;
          const widthPct = Math.min(100, (product.stock / product.maxScale) * 100);
          const thresholdPct = Math.min(100, (product.lowStockThreshold / product.maxScale) * 100);

          return (
            <div key={product.id}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-linen">{product.name}</span>
                <span className={isLow ? "font-medium text-red-400" : "text-linen/55"}>
                  {product.stock} in stock
                </span>
              </div>
              <div className="relative mt-1.5 h-2 w-full rounded-full bg-ink/40">
                <div
                  className={`h-full rounded-full ${isLow ? "bg-red-400/70" : "bg-clay"}`}
                  style={{ width: `${widthPct}%` }}
                />
                {/* threshold marker */}
                <div
                  className="absolute top-0 h-2 w-px bg-linen/40"
                  style={{ left: `${thresholdPct}%` }}
                  title={`Low stock threshold: ${product.lowStockThreshold}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}