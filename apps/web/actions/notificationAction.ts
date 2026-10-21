// actions/notificationActions.ts
"use server";

import { nestJsEndpoints } from "@/lib/nestJsEndpoints";
import { revalidateTag } from "next/cache";

export async function markAllNotificationsRead(): Promise<void> {
  await nestJsEndpoints.notificationsApi.markAllRead();
  revalidateTag("notifications", "max");
}