"use server"

import { revalidatePath, revalidateTag } from "next/cache";

export async function revalidateNotificationCache() {
  revalidateTag("myNotifications", "max"); 
}

export async function revalidateInviteCache() {
  revalidateTag("orgPendingInvites", "max");
  revalidateTag("orgRevokedInvites", "max");
}

export async function revalidateMemberCache() {
  revalidateTag("orgMembers", "max");
}

export async function revalidateProductCache() {
  revalidateTag("products", "max");
  revalidateTag("dashboardOverview", "max");
}

export async function revalidateStockMovementRequestsCache() {
  revalidateTag("stockMovementRequests", "max");
}

export async function revalidateStockMovementCache() {
  revalidatePath("/dashboard/products/[id]", "page");
  revalidateTag("stockMovements", "max");
  revalidateTag("stockMovementRequests", "max");
  revalidateTag("dashboardOverview", "max");
}