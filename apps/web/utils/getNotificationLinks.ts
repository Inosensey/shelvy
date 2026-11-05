type NotificationMetadata = {
  productId?: string;
  productName?: string;
  stockMovementId?: string;
  requestId?: string;
  status?: "APPROVED" | "REJECTED";
};

export function getNotificationHref(
  type: NotificationType,
  metadata: NotificationMetadata | null,
): string {
  switch (type) {
    case "MEMBER_JOINED":
      return "/dashboard/team";

    case "LOW_STOCK": {
      if (!metadata?.productId) return "/dashboard/products";
      // search narrows to page 1 so the highlighted row is always on screen
      const params = new URLSearchParams({ highlight: metadata.productId });
      if (metadata.productName) params.set("search", metadata.productName);
      return `/dashboard/products?${params.toString()}`;
    }

    case "STOCK_MOVEMENT":
      return metadata?.stockMovementId
        ? `/dashboard/stock-movements?highlight=${metadata.stockMovementId}`
        : "/dashboard/stock-movements";

    // a manager lands on the pending queue
    case "MOVEMENT_REQUESTED": {
      const params = new URLSearchParams({ status: "PENDING" });
      if (metadata?.requestId) params.set("highlight", metadata.requestId);
      return `/dashboard/stock-movements/requests?${params.toString()}`;
    }

    case "MOVEMENT_DECIDED": {
      const params = new URLSearchParams();
      if (metadata?.status) params.set("status", metadata.status);
      if (metadata?.requestId) params.set("highlight", metadata.requestId);
      const searchParams = params.toString();
      return searchParams
        ? `/dashboard/stock-movements/requests?${searchParams}`
        : "/dashboard/stock-movements/requests";
    }

    case "PAYMENT_FAILED":
      return "/dashboard/settings?tab=billing";
  }
}
