"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  resource: "products" | "stock-movements";
  label?: string;
}

export function ExportButton({ resource, label = "Export CSV" }: Props) {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      // the current page filters travel with it; the route handler whitelists them
      const res = await fetch(
        `/api/export/${resource}${searchParams ? `?${searchParams.toString()}` : ""}`,
      );

      // a login redirect would come back as HTML with a 200, so check the type too
      if (!res.ok || !res.headers.get("content-type")?.includes("text/csv")) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "Export failed. Please try again.");
      }

      const filename =
        /filename="?([^";]+)"?/.exec(
          res.headers.get("content-disposition") ?? "",
        )?.[1] ?? `${resource}.csv`;
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-md border border-linen/10 px-4 py-2 text-sm text-linen/80 hover:bg-linen/5 disabled:opacity-60"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {label}
    </button>
  );
}
