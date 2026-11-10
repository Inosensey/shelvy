interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

type paidPlans = "PREMIUM" | "ENTERPRISE" | undefined;
type InviteStatus = "COMPLETED" | "EXPIRED" | "PENDING" | "REVOKED";
type role = "OWNER" | "MANAGER" | "STAFF";

interface DashboardOverview {
  kpis: {
    activeProducts: number;
    totalUnits: number;
    stockValue: number;
    lowStockCount: number;
    pendingRequests: number;
  };
  lowStock: {
    id: string;
    name: string;
    stock: number;
    lowStockThreshold: number;
  }[];
  recentMovements: StockMovement[]; // same shape as the ledger rows
  activity: { day: string; inUnits: number; outUnits: number }[];
}

interface UserInformation {
  userId?: string;
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  birthDate?: string;
  gender?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

interface SendInviteEmailPayload {
  recipientEmail: string;
  role: role;
}

interface Organization {
  name: string;
  description?: string;
}

interface OnboardingInfo {
  userInfo: UserInformation;
  organization: Organization;
}

interface User {
  id: string;
  email: string;
  role: role;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

interface InviteDetails {
  email: string;
  organizationName: string;
  role: role;
  inviterName: string;
  isExistingUser: boolean;
}

interface InviteValidationResult {
  status: InviteStatus;
  invite?: InviteDetails;
}

interface OrgMember {
  id: string;
  email: string;
  createdAt: Date;
  role: role;
  usersInfo: [
    {
      firstName: string | null;
      lastName: string | null;
    },
  ];
}

interface OrgInvite {
  id: string;
  email: string;
  organizationId: string;
  role: role;
  token: string;
  invitedById: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  createdAt: Date;
  status: InviteStatus;
}

interface NotificationMetadata {
  productId?: string;
  stockMovementId?: string;
}

interface NotificationWithMetadata {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  metadata: NotificationMetadata | null;
}

type NotificationType =
  | "MEMBER_JOINED"
  | "LOW_STOCK"
  | "STOCK_MOVEMENT"
  | "PAYMENT_FAILED"
  | "MOVEMENT_REQUESTED"
  | "MOVEMENT_DECIDED";

interface Supplier {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  productsCount: number;
  createdAt: string;
  updatedAt: string;
}

interface SupplierOption {
  id: string;
  name: string;
}

interface SupplierInput {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  price: number;
  stock: number;
  lowStockThreshold: number;
  archivedAt: string | null;
  supplierId: string | null;
  supplier: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface ProductDetail extends Product {
  stats: { totalIn: number; totalOut: number; movementCount: number };
  trend: { createdAt: string; stockAfter: number }[];
}

type MovementType = "INITIAL" | "IN" | "OUT" | "ADJUSTMENT";

interface StockMovement {
  id: string;
  type: MovementType;
  delta: number;
  stockAfter: number;
  reason: string | null;
  note: string | null;
  createdAt: string;
  product: { id: string; name: string };
  performedBy: { id: string; email: string };
}

interface ProductOption {
  id: string;
  name: string;
  stock: number;
  sku: string | null;
}

type RequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

interface MovementRequest {
  id: string;
  type: MovementType;
  quantity: number;
  reason: string | null;
  note: string | null;
  status: RequestStatus;
  decisionNote: string | null;
  decidedAt: string | null;
  createdAt: string;
  product: { id: string; name: string; stock: number };
  requestedBy: { id: string; email: string };
  decidedBy: { id: string; email: string } | null;
}

interface ImportRowResult {
  row: number;
  action: "create" | "update" | "unchanged" | "error";
  sku: string | null;
  name: string;
  errors: string[];
  warnings: string[];
  generatedSku: boolean;
}

interface ImportPreview {
  summary: {
    create: number;
    update: number;
    unchanged: number;
    errors: number;
  };
  rows: ImportRowResult[];
  ignoredColumns: string[];
}

interface UserInfo {
  firstName: string;
  middleName: string | null;
  lastName: string;
  suffix: string | null;
  phone: string | null;
}

interface SecurityInfo {
  authProvider: "LOCAL" | "GOOGLE" | "GITHUB";
  hasPassword: boolean;
  activeSessions: number;
}

interface MyOrganization {
  id: string;
  name: string;
  description: string | null;
}

interface BillingPayment {
  id: string;
  amount: number; // cents
  currency: string;
  status: "COMPLETED" | "FAILED" | "REFUNDED" | "PENDING";
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  failureReason: string | null;
}

interface BillingOverview {
  plan: "FREE" | "PREMIUM" | "ENTERPRISE";
  status: "ACTIVE" | "CANCELED" | "PAST_DUE" | "UNPAID" | "INCOMPLETE" | null;
  amount?: number;
  currentPeriodEnd?: string | null;
  nextPaymentDate?: string | null;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: string | null;
  failedAttempts?: number;
  lastPaymentError?: string | null;
  payments: BillingPayment[];
}
