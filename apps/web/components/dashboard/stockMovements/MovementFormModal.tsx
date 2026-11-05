"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/reusable/ui/Modal";
import { AuthButton } from "@/components/auth/AuthButton";
import { FormMessage } from "@/components/reusable/FormMessage";
import { recordMovement } from "@/actions/stockMovementAction";
import { submitRequest } from "@/actions/stockMovementRequestAction";

const initialState: ApiResponse<null> = {
  success: false,
  message: "",
  data: null,
};
const input =
  "w-full rounded-md border border-linen/10 bg-ink/40 px-3 py-2 text-sm text-linen placeholder:text-linen/30 focus:border-clay/60 focus:outline-none";

const TYPES = [
  {
    value: "IN",
    label: "Stock in",
    active: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
  },
  {
    value: "OUT",
    label: "Stock out",
    active: "border-red-500/50 bg-red-500/10 text-red-400",
  },
  {
    value: "ADJUSTMENT",
    label: "Adjustment",
    active: "border-amber-500/50 bg-amber-500/10 text-amber-400",
  },
] as const;

interface Props {
  products: ProductOption[];
  defaultProductId?: string;
  mode?: "record" | "request";
  onClose: () => void;
}

export function MovementFormModal({
  products,
  defaultProductId,
  mode = "record",
  onClose,
}: Props) {
  const isRequest = mode === "request";
  const [state, formAction, isPending] = useActionState(
    isRequest ? submitRequest : recordMovement,
    initialState,
  );
  const [productId, setProductId] = useState(defaultProductId ?? "");
  const [type, setType] = useState<"IN" | "OUT" | "ADJUSTMENT">("IN");
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (state.success) {
      toast.success(state.message);
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const product = products.find((p) => p.id === productId);
  const q = Number(quantity);
  const validQty = quantity !== "" && Number.isInteger(q) && q !== 0;
  const next =
    product && validQty
      ? product.stock +
        (type === "OUT" ? -Math.abs(q) : type === "IN" ? Math.abs(q) : q)
      : null;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const reason = String(
      new FormData(e.currentTarget).get("reason") ?? "",
    ).trim();
    let msg = "";
    if (!productId) msg = "Choose a product.";
    else if (!validQty) msg = "Enter a whole-number quantity.";
    else if (type !== "ADJUSTMENT" && q < 0)
      msg = "Quantity must be greater than zero.";
    else if (type === "ADJUSTMENT" && !reason)
      msg = "A reason is required for adjustments.";
    else if (next !== null && next < 0)
      msg = `Not enough stock. Only ${product!.stock} available.`;
    if (msg) {
      e.preventDefault();
      setError(msg);
    } else setError("");
  }

  return (
    <Modal
      onClose={onClose}
      locked={isPending}
      labelledBy="movement-form-title"
      maxWidth="max-w-lg"
    >
      <h2 id="movement-form-title" className="font-display text-lg text-linen">
        {isRequest ? "Request stock change" : "Record movement"}
        
      </h2>
      {isRequest && <p className="mt-1 text-sm text-linen/50">A manager reviews this before stock changes.</p>}

      <form
        action={formAction}
        onSubmit={handleSubmit}
        noValidate
        className="mt-5 flex flex-col gap-4"
      >
        <input type="hidden" name="type" value={type} />

        <fieldset
          disabled={isPending}
          className="m-0 flex flex-col gap-4 border-0 p-0"
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-linen/50">
              Product
            </span>
            <select
              name="productId"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className={input}
            >
              <option value="">Select a product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {`${p.name}${p.sku ? ` · ${p.sku}` : ""} (${p.stock} in stock)`}
                </option>
              ))}
            </select>
          </label>

          <div
            role="radiogroup"
            aria-label="Movement type"
            className="grid grid-cols-3 gap-2"
          >
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                role="radio"
                aria-checked={type === t.value}
                onClick={() => setType(t.value)}
                className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                  type === t.value
                    ? t.active
                    : "border-linen/10 text-linen/50 hover:text-linen"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-linen/50">
              {type === "ADJUSTMENT" ? "Change (use − to remove)" : "Quantity"}
            </span>
            <input
              name="quantity"
              type="number"
              step="1"
              value={quantity}
              min={type === "ADJUSTMENT" ? undefined : 1}
              onChange={(e) => setQuantity(e.target.value)}
              className={input}
            />
            {product && next !== null && (
              <span
                className={`text-xs ${next < 0 ? "text-red-400" : "text-linen/50"}`}
              >
                Stock: {product.stock} →{" "}
                <span className="font-medium">{next}</span>
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-linen/50">
              Reason {type === "ADJUSTMENT" ? "" : "(optional)"}
            </span>
            <input
              name="reason"
              placeholder={
                type === "ADJUSTMENT"
                  ? "e.g. Cycle count, damaged"
                  : "e.g. Supplier delivery, sale"
              }
              className={input}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-linen/50">
              Note (optional)
            </span>
            <textarea name="note" rows={2} className={input} />
          </label>
        </fieldset>

        {(error || (!state.success && state.message)) && (
          <FormMessage message={error || state.message} success={false} />
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-md px-4 py-2 text-sm font-medium text-linen/60 hover:text-linen disabled:opacity-50"
          >
            Cancel
          </button>
          <AuthButton
            type="submit"
            loading={isPending}
            loadingText={isRequest ? "Submitting…" : "Recording…"}
            className="w-auto px-6"
          >
            {isRequest ? "Submit request" : "Record movement"}
          </AuthButton>
        </div>
      </form>
    </Modal>
  );
}
