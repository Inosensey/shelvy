interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

type InviteStatus = "COMPLETED" | "EXPIRED" | "PENDING" | "REVOKED";
type role = "OWNER" | "MANAGER" | "STAFF";

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
  isExistingUser: boolean
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
  type: "MEMBER_JOINED" | "LOW_STOCK" | "STOCK_MOVEMENT" | "PAYMENT_FAILED";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  metadata: NotificationMetadata | null;
  metadata: Record<string> | null;
}


type NotificationType = 
  | 'MEMBER_JOINED' 
  | 'INVITE_SENT' 
  | 'INVITE_REVOKED'
  | 'INFO' 
  | string; 