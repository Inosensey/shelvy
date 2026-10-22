// app/api/socket-ticket/route.ts
import { nestJsEndpoints } from "@/lib/nestJsEndpoints";

export async function GET() {
  const res = await nestJsEndpoints.authApi.createSocketTicket();
  if (!res.success || !res.data) {
    return Response.json({ ticket: null }, { status: 401 });
  }
  return Response.json({ ticket: res.data.ticket });
}