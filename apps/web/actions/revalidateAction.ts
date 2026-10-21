"use server"

import { revalidateTag } from "next/cache";

export async function revalidateNotificationCache() {
  revalidateTag("myNotifications", "max"); 
}
