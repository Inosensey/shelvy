import { NextRequest, NextResponse } from "next/server";
import { nestJsEndpoints } from "@/lib/nestJsEndpoints";

const RESOURCES = {
  products: {
    path: "/products/misc/export",
    params: ["search", "supplierId", "lowStock", "archived"],
  },
  "stock-movements": {
    path: "/stock-movements/misc/export",
    params: ["productId", "type", "from", "to"],
  },
} as const;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resource: string }> },
) {
  const { resource } = await params;
  const config = RESOURCES[resource as keyof typeof RESOURCES];
  if (!config)
    return NextResponse.json({ message: "Not found." }, { status: 404 });

  const searchParams = new URLSearchParams();
  for (const key of config.params) {
    const value = request.nextUrl.searchParams.get(key);
    if (value) searchParams.set(key, value);
  }


  const upstream = await nestJsEndpoints.requestWithRawResponse(
    `${config.path}${searchParams.toString() === "" ? `?${searchParams.toString()}` : ""}`,
  );

  console.log('url', `${config.path}${searchParams.toString() === "" ? `?${searchParams.toString()}` : ""}`);

  if (upstream === null) {
    return NextResponse.json({ message: "Export failed." }, { status: 500 });
  }

  console.log('upstream:', upstream);

  console.log(
    "export url",
    `${config.path}${searchParams.toString() === "" ? `?${searchParams.toString()}` : ""}`,
  );

  if (!upstream.ok || !upstream.body) {
    const body = await upstream.json().catch(() => null);
    return NextResponse.json(
      { message: body?.message ?? "Export failed." },
      { status: upstream.status || 500 },
    );
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        upstream.headers.get("content-disposition") ??
        `attachment; filename="${resource}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
