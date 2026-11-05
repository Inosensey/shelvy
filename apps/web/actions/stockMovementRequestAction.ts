"use server";

import { updateTag } from "next/cache";
import { nestJsEndpoints } from "@/lib/nestJsEndpoints";

const fail = (message: string): ApiResponse<null> => ({
  success: false,
  message,
  data: null,
});

export async function submitRequest(
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
    const response =
      await nestJsEndpoints.stockMovementRequestApi.createRequest({
        productId,
        type,
        quantity,
        reason,
        note: String(formData.get("note") ?? "").trim(),
      });
    if (!response || !response.success)
      return fail(response?.message ?? "Could not submit the request.");
    updateTag("stockMovementRequests");
    updateTag("products");
    return {
      success: true,
      message: "Request submitted. A manager will review it.",
      data: null,
    };
  } catch (e) {
    return fail(
      e instanceof Error ? e.message : "Could not submit the request.",
    );
  }
}

export async function decideRequest(
  id: string,
  productId: string,
  decision: "approve" | "reject",
  note: string,
): Promise<ApiResponse<null>> {
  try {
    const response = await nestJsEndpoints.stockMovementRequestApi.decide(
      id,
      decision,
      note.trim(),
    );
    if (!response || !response.success)
      return fail(response?.message ?? "Something went wrong.");

    if (decision === "approve") {
      updateTag("products");
      updateTag(`product-${productId}`);
    }
    updateTag("stockMovementRequests");
    return {
      success: true,
      message:
        decision === "approve"
          ? "Request approved. Stock updated."
          : "Request rejected.",
      data: null,
    };
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Something went wrong.");
  }
}

export async function cancelRequest(id: string): Promise<ApiResponse<null>> {
  try {
    const response =
      await nestJsEndpoints.stockMovementRequestApi.cancelRequest(id);
    if (!response || !response.success)
      return fail(response?.message ?? "Something went wrong.");
    updateTag("stockMovementRequests");
    updateTag("products");
    return { success: true, message: "Request cancelled.", data: null };
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Something went wrong.");
  }
}
