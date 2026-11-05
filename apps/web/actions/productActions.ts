"use server";

import { updateTag } from "next/cache";
import { nestJsEndpoints } from "@/lib/nestJsEndpoints";

const fail = (message: string): ApiResponse<null> => ({
  success: false,
  message,
  data: null,
});

export async function generateSku(
  name: string,
): Promise<ApiResponse<string | null>> {
  if (!name.trim())
    return {
      success: false,
      message: "Enter a product name first.",
      data: null,
    };
  try {
    const response = await nestJsEndpoints.productApi.suggestSku(name.trim());
    if (!response || !response.success || !response.data) {
      return {
        success: false,
        message: response?.message ?? "Could not generate a SKU.",
        data: null,
      };
    }
    return response;
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Could not generate a SKU.",
      data: null,
    };
  }
}

export async function saveProduct(
  _prev: ApiResponse<null>,
  formData: FormData,
): Promise<ApiResponse<null>> {
  const id = (formData.get("id") as string) || null;
  const name = String(formData.get("name") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();

  if (!name) return fail("Product name is required.");
  if (
    priceRaw === "" ||
    Number.isNaN(Number(priceRaw)) ||
    Number(priceRaw) < 0
  ) {
    return fail("Enter a valid price.");
  }

  const payload: Record<string, unknown> = {
    name,
    description: String(formData.get("description") ?? "").trim(),
    sku: String(formData.get("sku") ?? ""),
    price: Number(priceRaw),
    supplierId: String(formData.get("supplierId") ?? ""),
    lowStockThreshold: Number(formData.get("lowStockThreshold") ?? 5),
  };
  if (!id) payload.initialStock = Number(formData.get("initialStock") || 0);

  try {
    const response = id
      ? await nestJsEndpoints.productApi.updateProduct(id, payload)
      : await nestJsEndpoints.productApi.createProduct(payload);
    if (!response || !response.success)
      return fail(response?.message ?? "Could not save the product.");
    updateTag("products");
    return {
      success: true,
      message: id ? "Product updated." : "Product created.",
      data: null,
    };
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Could not save the product.");
  }
}

export async function setProductArchived(
  id: string,
  archived: boolean,
): Promise<ApiResponse<null>> {
  try {
    const response = await nestJsEndpoints.productApi.setArchived(id, archived);
    if (!response || !response.success)
      return fail(response?.message ?? "Something went wrong.");
    updateTag("products");
    updateTag(`product-${id}`);
    return {
      success: true,
      message: archived ? "Product archived." : "Product restored.",
      data: null,
    };
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Something went wrong.");
  }
}
