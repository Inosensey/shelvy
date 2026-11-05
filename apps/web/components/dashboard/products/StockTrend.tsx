interface Props {
  trend: ProductDetail["trend"];
  threshold: number;
}

const W = 300;
const H = 80;
const PAD = 4;

export function StockTrend({ trend, threshold }: Props) {
  if (trend.length < 2) {
    return (
      <p className="py-8 text-center text-sm text-linen/40">
        Not enough history to draw a trend yet.
      </p>
    );
  }

  const values = trend.map((t) => t.stockAfter);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const x = (i: number) => (i / (trend.length - 1)) * W;
  const y = (v: number) => H - PAD - ((v - min) / span) * (H - PAD * 2);

  const points = trend.map((t, i) => `${x(i)},${y(t.stockAfter)}`).join(" ");
  const showThreshold = threshold >= min && threshold <= max;

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Stock level over the last ${trend.length} movements, from ${values[0]} to ${values[values.length - 1]}`}
        className="h-24 w-full"
      >
        {showThreshold && (
          <line
            x1="0"
            x2={W}
            y1={y(threshold)}
            y2={y(threshold)}
            stroke="currentColor"
            className="text-amber-400/50"
            strokeDasharray="4 4"
            vectorEffect="non-scaling-stroke"
          />
        )}
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          className="text-clay"
          strokeWidth="2"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="mt-1 flex justify-between text-xs text-linen/40">
        <span>Low {min}</span>
        <span>
          {showThreshold
            ? "Dashed line: low-stock alert level"
            : `Last ${trend.length} movements`}
        </span>
        <span>High {max}</span>
      </div>
    </div>
  );
}
