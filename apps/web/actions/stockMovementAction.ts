"use server";

import { updateTag } from "next/cache";
import { nestJsEndpoints } from "@/lib/nestJsEndpoints";

const fail = (message: string): ApiResponse<null> => ({
  success: false,
  message,
  data: null,
});

export async function recordMovement(
  _prev: ApiResponse<null>,
  formData: FormData,
): Promise<ApiResponse<null>> {
  const productId = String(formData.get("productId") ?? "");
  const type = String(formData.get("type") ?? "");
  const quantity = Number(formData.get("quantity"));
  const reason = String(formData.get("reason") ?? "").trim();

  if (!productId) return fail("Choose a product.");
  if (!Number.isInteger(quantity) || quantity === 0)
    return fail("Enter a whole-number quantity.");
  if (type !== "ADJUSTMENT" && quantity < 0)
    return fail("Quantity must be greater than zero.");
  if (type === "ADJUSTMENT" && !reason)
    return fail("A reason is required for adjustments.");

  try {
    const response = await nestJsEndpoints.stockMovementsApi.recordMovement({
      productId,
      type,
      quantity,
      reason,
      note: String(formData.get("note") ?? "").trim(),
    });
    if (!response || !response.success)
      return fail(response?.message ?? "Could not record the movement.");
    updateTag("products");
    updateTag("stockMovements");
    updateTag(`product-${productId}`);
    return { success: true, message: "Movement recorded.", data: null };
  } catch (e) {
    return fail(
      e instanceof Error ? e.message : "Could not record the movement.",
    );
  }
}
