import { Panel } from "./Panel";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const label = (day: string) => {
  const [, m, d] = day.split("-");
  return `${MONTHS[Number(m) - 1]} ${Number(d)}`;
};

export function ActivityChart({
  data,
}: {
  data: DashboardOverview["activity"];
}) {
  const max = Math.max(1, ...data.flatMap((d) => [d.inUnits, d.outUnits]));
  const totalIn = data.reduce((s, d) => s + d.inUnits, 0);
  const totalOut = data.reduce((s, d) => s + d.outUnits, 0);
  const empty = totalIn === 0 && totalOut === 0;

  return (
    <Panel title="Last 14 days">
      {empty ? (
        <p className="py-10 text-center text-sm text-linen/40">
          No stock in or out in the last 14 days.
        </p>
      ) : (
        <>
          <div className="mb-3 flex gap-4 text-xs text-linen/50">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-emerald-400" />
              In · {totalIn}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-red-400" />
              Out · {totalOut}
            </span>
          </div>

          <div
            role="img"
            aria-label={`Units moved per day over the last 14 days: ${totalIn} in, ${totalOut} out`}
            className="flex h-32 items-end gap-1"
          >
            {data.map((d) => (
              <div
                key={d.day}
                title={`${label(d.day)}: +${d.inUnits} in, −${d.outUnits} out`}
                className="flex h-full flex-1 items-end justify-center gap-0.5"
              >
                <div
                  className="w-full max-w-2.5 rounded-t-sm bg-emerald-400/80"
                  style={{
                    height: `${(d.inUnits / max) * 100}%`,
                    minHeight: d.inUnits ? 2 : 0,
                  }}
                />
                <div
                  className="w-full max-w-2.5 rounded-t-sm bg-red-400/80"
                  style={{
                    height: `${(d.outUnits / max) * 100}%`,
                    minHeight: d.outUnits ? 2 : 0,
                  }}
                />
              </div>
            ))}
          </div>

          <div className="mt-2 flex justify-between text-xs text-linen/40">
            <span>{label(data[0].day)}</span>
            <span>{label(data[data.length - 1].day)}</span>
          </div>
        </>
      )}
    </Panel>
  );
}
