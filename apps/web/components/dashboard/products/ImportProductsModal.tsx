"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/reusable/ui/Modal";

const TEMPLATE =
  "sku,name,description,supplier,price,low_stock_alert,initial_stock\r\n" +
  "TSH-0001,Black T-Shirt,Cotton tee,,350.00,10,50\r\n";

const ACTION_STYLE: Record<
  ImportRowResult["action"],
  { label: string; cls: string }
> = {
  create: { label: "New", cls: "bg-emerald-500/15 text-emerald-400" },
  update: { label: "Update", cls: "bg-sky-500/15 text-sky-400" },
  unchanged: { label: "No change", cls: "bg-linen/10 text-linen/50" },
  error: { label: "Error", cls: "bg-red-500/15 text-red-400" },
};

const MAX_SHOWN = 100;

function downloadTemplate() {
  const url = URL.createObjectURL(
    new Blob([TEMPLATE], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "products-import-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function ImportProductsModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [busy, setBusy] = useState<"preview" | "commit" | null>(null);
  const [error, setError] = useState("");

  async function send(mode: "preview" | "commit") {
    if (!file) return;
    setBusy(mode);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/import/${mode}`, {
        method: "POST",
        body: form,
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) {
        const msg = Array.isArray(body?.message)
          ? body.message.join(" ")
          : body?.message;
        throw new Error(msg ?? "Something went wrong.");
      }
      if (mode === "preview") {
        setPreview(body.data as ImportPreview);
      } else {
        const d = body.data as {
          created: number;
          updated: number;
          unchanged: number;
        };
        toast.success(
          `Import complete: ${d.created} new, ${d.updated} updated.`,
        );
        router.refresh();
        onClose();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  function chooseFile(e: React.ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null);
    setPreview(null);
    setError("");
  }

  const rows = preview
    ? [...preview.rows].sort(
        (a, b) => Number(b.action === "error") - Number(a.action === "error"),
      )
    : [];
  const canCommit =
    !!preview &&
    preview.summary.errors === 0 &&
    preview.summary.create + preview.summary.update > 0;

  return (
    <Modal
      onClose={onClose}
      locked={busy !== null}
      labelledBy="import-title"
      maxWidth="max-w-3xl"
    >
      <h2 id="import-title" className="font-display text-lg text-linen">
        Import products from CSV
      </h2>

      {!preview ? (
        <div className="mt-4 flex flex-col gap-4">
          <ul className="list-disc space-y-1 pl-5 text-sm text-linen/60">
            <li>
              Columns:{" "}
              <span className="font-mono text-xs">
                sku, name, description, supplier, price, low_stock_alert,
                initial_stock
              </span>
              . Name and price are required.
            </li>
            <li>
              A row whose SKU already exists{" "}
              <strong className="text-linen/80">updates</strong> that product.
              Any other row creates a new one, with a generated SKU if blank.
            </li>
            <li>
              A blank cell leaves the existing value alone. Stock is never
              changed for existing products. Use stock movements for that.
            </li>
            <li>Suppliers must already exist. Maximum 1,000 rows and 1 MB.</li>
          </ul>

          <button
            type="button"
            onClick={downloadTemplate}
            className="inline-flex w-fit items-center gap-2 text-sm text-clay hover:underline"
          >
            <Download className="h-4 w-4" /> Download template
          </button>

          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-linen/20 px-6 py-8 text-center hover:bg-linen/3">
            <Upload className="h-6 w-6 text-linen/40" />
            <span className="text-sm text-linen/70">
              {file ? file.name : "Choose a .csv file"}
            </span>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={chooseFile}
              className="sr-only"
            />
          </label>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-400">
              {preview.summary.create} new
            </span>
            <span className="rounded-full bg-sky-500/15 px-3 py-1 text-sky-400">
              {preview.summary.update} to update
            </span>
            <span className="rounded-full bg-linen/10 px-3 py-1 text-linen/60">
              {preview.summary.unchanged} unchanged
            </span>
            <span
              className={`rounded-full px-3 py-1 ${preview.summary.errors ? "bg-red-500/15 text-red-400" : "bg-linen/10 text-linen/60"}`}
            >
              {preview.summary.errors} with errors
            </span>
          </div>

          {preview.ignoredColumns.length > 0 && (
            <p className="text-xs text-linen/50">
              Ignored columns: {preview.ignoredColumns.join(", ")}.
            </p>
          )}

          {preview.summary.errors > 0 && (
            <p className="text-sm text-red-400">
              Fix the errors in your file and choose it again. Nothing is
              imported until every row is valid.
            </p>
          )}

          <div className="max-h-80 overflow-auto rounded-xl border border-linen/10">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-surface text-xs uppercase tracking-wide text-linen/40">
                <tr>
                  <th className="px-3 py-2 font-medium">Row</th>
                  <th className="px-3 py-2 font-medium">Action</th>
                  <th className="px-3 py-2 font-medium">SKU</th>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, MAX_SHOWN).map((r) => {
                  const s = ACTION_STYLE[r.action];
                  return (
                    <tr
                      key={r.row}
                      className="border-t border-linen/5 align-top"
                    >
                      <td className="px-3 py-2 tabular-nums text-linen/50">
                        {r.row}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}
                        >
                          {s.label}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-linen/70">
                        {r.sku ?? "—"}
                        {r.generatedSku && (
                          <span className="ml-1 text-linen/40">
                            (generated)
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-linen">{r.name || "—"}</td>
                      <td className="px-3 py-2 text-xs">
                        {r.errors.map((m) => (
                          <p key={m} className="text-red-400">
                            {m}
                          </p>
                        ))}
                        {r.warnings.map((m) => (
                          <p key={m} className="text-amber-400">
                            {m}
                          </p>
                        ))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {rows.length > MAX_SHOWN && (
            <p className="text-xs text-linen/40">
              Showing the first {MAX_SHOWN} of {rows.length} rows (errors
              first).
            </p>
          )}
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={busy !== null}
          className="rounded-md px-4 py-2 text-sm font-medium text-linen/60 hover:text-linen disabled:opacity-50"
        >
          Cancel
        </button>

        {!preview ? (
          <button
            type="button"
            onClick={() => send("preview")}
            disabled={!file || busy !== null}
            className="inline-flex items-center gap-2 rounded-md bg-clay px-4 py-2 text-sm font-medium text-ink hover:bg-clay/90 disabled:opacity-50"
          >
            {busy === "preview" && <Loader2 className="h-4 w-4 animate-spin" />}{" "}
            Preview
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                setFile(null);
              }}
              disabled={busy !== null}
              className="rounded-md border border-linen/10 px-4 py-2 text-sm text-linen/70 hover:bg-linen/5 disabled:opacity-50"
            >
              Choose another file
            </button>
            <button
              type="button"
              onClick={() => send("commit")}
              disabled={!canCommit || busy !== null}
              className="inline-flex items-center gap-2 rounded-md bg-clay px-4 py-2 text-sm font-medium text-ink hover:bg-clay/90 disabled:opacity-50"
            >
              {busy === "commit" && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Import {preview.summary.create + preview.summary.update}{" "}
              product(s)
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}
