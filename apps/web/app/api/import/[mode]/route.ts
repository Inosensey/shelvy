import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { nestJsEndpoints } from "@/lib/nestJsEndpoints";
import { revalidateProductCache } from "@/actions/revalidateAction";

const MAX_BYTES = 1_000_000;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ mode: string }> },
) {
  const { mode } = await params;
  if (mode !== "preview" && mode !== "commit") {
    return NextResponse.json(
      { success: false, message: "Not found." },
      { status: 404 },
    );
  }

  const incoming = await request.formData();
  const file = incoming.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { success: false, message: "Choose a CSV file." },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { success: false, message: "The file is larger than 1 MB." },
      { status: 413 },
    );
  }

  const form = new FormData();
  form.append("file", file, file.name);

  const upstream = await nestJsEndpoints.productApi.postForm(
    `/products/misc/import/${mode}`,
    form,
  );
  if (!upstream) {
    return NextResponse.json(
      { success: false, message: "Import failed. Please try again." },
      { status: 500 },
    );
  }

  const body = await upstream.json().catch(() => null);

  if (!upstream.ok || body?.success === false) {
    const message = Array.isArray(body?.message)
      ? body.message.join(" ")
      : body?.message;
    return NextResponse.json(
      {
        success: false,
        message: message || "Import failed. Please try again.",
      },
      { status: upstream.ok ? 400 : upstream.status },
    );
  }

  if (mode === "commit") {
    await revalidateProductCache();
    revalidatePath("/dashboard/products/[id]", "page");
  }

  return NextResponse.json(body, { status: upstream.status });
}
