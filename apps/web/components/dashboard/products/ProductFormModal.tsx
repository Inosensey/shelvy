"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import { Modal } from "@/components/reusable/ui/Modal";
import { AuthButton } from "@/components/auth/AuthButton";
import { FormMessage } from "@/components/reusable/FormMessage";
import { generateSku, saveProduct } from "@/actions/productActions";
import { Loader2, Sparkles } from "lucide-react";

const initialState: ApiResponse<null> = {
  success: false,
  message: "",
  data: null,
};
const input =
  "w-full rounded-md border border-linen/10 bg-ink/40 px-3 py-2 text-sm text-linen placeholder:text-linen/30 focus:border-clay/60 focus:outline-none";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-linen/50">
        {label}
      </span>
      {children}
      {hint && <span className="text-xs text-linen/40">{hint}</span>}
    </label>
  );
}

interface ProductFormModalProps {
  product: Product | null; // null = creating
  suppliers: SupplierOption[];
  onClose: () => void;
}

export function ProductFormModal({
  product,
  suppliers,
  onClose,
}: ProductFormModalProps) {
  const [state, formAction, isPending] = useActionState(
    saveProduct,
    initialState,
  );
  const [error, setError] = useState("");
  const [sku, setSku] = useState(product?.sku ?? "");

  const [generating, startGenerating] = useTransition();
  const nameRef = useRef<HTMLInputElement>(null);
  function handleGenerate() {
    startGenerating(async () => {
      console.log("Generating SKU for", nameRef.current?.value);
      const result = await generateSku(nameRef.current?.value ?? "");
      if (result.success && result.data) {
        setSku(result.data);
        setError("");
      } else {
        setError(result.message);
      }
    });
  }

  useEffect(() => {
    if (state.success) {
      toast.success(state.message);
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const fd = new FormData(e.currentTarget);
    const price = Number(fd.get("price"));
    if (!String(fd.get("name")).trim()) {
      e.preventDefault();
      return setError("Product name is required.");
    }
    if (fd.get("price") === "" || Number.isNaN(price) || price < 0) {
      e.preventDefault();
      return setError("Enter a valid price.");
    }
    setError("");
  }

  return (
    <Modal
      onClose={onClose}
      locked={isPending}
      labelledBy="product-form-title"
      maxWidth="max-w-lg"
    >
      <h2 id="product-form-title" className="font-display text-lg text-linen">
        {product ? "Edit product" : "Add product"}
      </h2>

      <form
        action={formAction}
        onSubmit={handleSubmit}
        noValidate
        className="mt-5 flex flex-col gap-4"
      >
        {product && <input type="hidden" name="id" value={product.id} />}

        <fieldset
          disabled={isPending}
          className="m-0 flex flex-col gap-4 border-0 p-0"
        >
          <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
            <Field label="Name">
              <input
                name="name"
                ref={nameRef}
                defaultValue={product?.name}
                className={input}
                autoFocus
              />
            </Field>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="sku"
                  className="text-xs font-medium uppercase tracking-wide text-linen/50"
                >
                  SKU
                </label>
                {(!product || !product.sku) && (
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={generating}
                    className="inline-flex items-center gap-1 text-xs text-clay hover:underline disabled:opacity-50"
                  >
                    {generating ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                    Generate
                  </button>
                )}
              </div>
              <input
                id="sku"
                name="sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Optional"
                className={`${input} font-mono uppercase`}
              />
            </div>
          </div>

          <Field label="Description (optional)">
            <textarea
              name="description"
              defaultValue={product?.description ?? ""}
              rows={2}
              className={input}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Price (₱)">
              <input
                name="price"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                defaultValue={product?.price}
                className={input}
              />
            </Field>
            <Field label="Supplier (optional)">
              <select
                name="supplierId"
                defaultValue={product?.supplierId ?? ""}
                className={input}
              >
                <option value="">No supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {product ? (
              <Field
                label="Current stock"
                hint="Change stock by recording a movement."
              >
                <input
                  value={product.stock}
                  readOnly
                  disabled
                  className={`${input} opacity-60`}
                />
              </Field>
            ) : (
              <Field label="Initial stock">
                <input
                  name="initialStock"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={0}
                  className={input}
                />
              </Field>
            )}
            <Field
              label="Low-stock alert at"
              hint="Alert when stock reaches this number."
            >
              <input
                name="lowStockThreshold"
                type="number"
                min="0"
                step="1"
                defaultValue={product?.lowStockThreshold ?? 5}
                className={input}
              />
            </Field>
          </div>
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
            loadingText="Saving…"
            className="w-auto px-6"
          >
            {product ? "Save changes" : "Add product"}
          </AuthButton>
        </div>
      </form>
    </Modal>
  );
}
