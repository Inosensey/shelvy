type NotificationMetadata = {
  productId?: string;
  stockMovementId?: string;
};

export function getNotificationHref(
  type: "MEMBER_JOINED" | "LOW_STOCK" | "STOCK_MOVEMENT" | "PAYMENT_FAILED",
  metadata: NotificationMetadata | null,
): string {
  switch (type) {
    case "MEMBER_JOINED":
      return "/dashboard/team";
    case "LOW_STOCK":
      return metadata?.productId
        ? `/dashboard/products?highlight=${metadata.productId}`
        : "/dashboard/products";
    case "STOCK_MOVEMENT":
      return metadata?.stockMovementId
        ? `/dashboard/stock-movements?highlight=${metadata.stockMovementId}`
        : "/dashboard/stock-movements";
    case "PAYMENT_FAILED":
      return "/dashboard/settings?tab=billing";
  }
}