"use server";

import { revalidatePath, updateTag } from "next/cache";
import { nestJsEndpoints } from "@/lib/nestJsEndpoints";

const fail = (message: string): ApiResponse<null> => ({
  success: false,
  message,
  data: null,
});

// Products list supplier names and dropdowns, so refresh both pages
function refresh() {
  revalidatePath("/dashboard/suppliers");
  revalidatePath("/dashboard/products");
}

export async function saveSupplier(
  _prev: ApiResponse<null>,
  formData: FormData,
): Promise<ApiResponse<null>> {
  const id = (formData.get("id") as string) || null;
  const payload: SupplierInput = {
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
  };

  if (!payload.name) return fail("Supplier name is required.");

  try {
    const response = id
      ? await nestJsEndpoints.supplierApi.updateSupplier(id, payload)
      : await nestJsEndpoints.supplierApi.createSupplier(payload);

    if (!response || !response.success) {
      return fail(
        response?.message ?? "Something went wrong saving the supplier.",
      );
    }

    updateTag("suppliers");
    return {
      success: true,
      message: id ? "Supplier updated." : "Supplier created.",
      data: null,
    };
  } catch (error) {
    return fail(
      error instanceof Error
        ? error.message
        : "Something went wrong saving the supplier.",
    );
  }
}

export async function deleteSupplier(id: string): Promise<ApiResponse<null>> {
  try {
    const response = await nestJsEndpoints.supplierApi.deleteSupplier(id);
    if (!response || !response.success) {
      return fail(
        response?.message ?? "Something went wrong deleting the supplier.",
      );
    }
    updateTag("suppliers");
    return { success: true, message: "Supplier deleted.", data: null };
  } catch (error) {
    return fail(
      error instanceof Error
        ? error.message
        : "Something went wrong deleting the supplier.",
    );
  }
}
