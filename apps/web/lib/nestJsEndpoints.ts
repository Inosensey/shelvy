import { cookies, headers as nextHeaders } from "next/headers";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const isServer = () => typeof window === "undefined";

const USER_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60,
  path: "/",
} as const;

class NestJsEndpoints {
  private async readCookie(name: string): Promise<string | undefined> {
    if (!isServer()) return undefined;
    return (await cookies()).get(name)?.value;
  }

  async setUserData(userId: string, email: string) {
    const cookieStore = await cookies();
    cookieStore.set("user_id", userId, USER_COOKIE_OPTIONS);
    cookieStore.set("email", email, USER_COOKIE_OPTIONS);
  }

  async clearUserData() {
    const cookieStore = await cookies();
    cookieStore.delete("user_id");
    cookieStore.delete("email");
    cookieStore.delete("token");
  }

  private async getHeaders(): Promise<Headers> {
    const headers = new Headers({ "Content-Type": "application/json" });

    if (isServer()) {
      const [cookieStore, reqHeaders] = await Promise.all([
        cookies(),
        nextHeaders(),
      ]);

      const token = cookieStore.get("token")?.value;
      if (token) headers.set("Cookie", `token=${token}`);

      const ip = reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
      // eslint-disable-next-line turbo/no-undeclared-env-vars
      const key = process.env.INTERNAL_API_KEY;
      if (ip && key) {
        headers.set("x-client-ip", ip);
        headers.set("x-internal-key", key);
      }
    }
    return headers;
  }

  private async buildHeaders(extra?: HeadersInit): Promise<Headers> {
    const headers = await this.getHeaders();
    new Headers(extra).forEach((value, key) => headers.set(key, value));
    return headers;
  }

  private async persistSessionCookie(responseHeaders: Headers) {
    const token = responseHeaders
      .get("set-cookie")
      ?.match(/token=([^;]+)/)?.[1];
    if (!token) return;
    (await cookies()).set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    persistSession: boolean = false,
  ): Promise<ApiResponse<T | null>> {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: await this.buildHeaders(options.headers),
        ...(isServer() ? {} : { credentials: "include" as RequestCredentials }),
        mode: "cors",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          message: errorData.message || `HTTP ${response.status}`,
          data: null,
        };
      }

      if (persistSession) await this.persistSessionCookie(response.headers);

      return response.json();
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Network error",
        data: null,
      };
    }
  }

  async requestWithRawResponse(
    endpoint: string,
    options: RequestInit = {},
    persistSession: boolean = false,
    returnErrorResponse: boolean = false,
  ) {
    try {
      const headers = await this.buildHeaders(options.headers);
      if (options.body instanceof FormData) headers.delete("content-type");

      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
        ...(isServer() ? {} : { credentials: "include" as RequestCredentials }),
        mode: "cors",
      });

      if (!response.ok) {
        if (returnErrorResponse) return response; // let the caller read the error body
        const errorData = await response.json().catch(() => ({}));
        console.log(errorData.message || `HTTP ${response.status}`);
        return null;
      }

      if (persistSession) await this.persistSessionCookie(response.headers);

      return response;
    } catch (error) {
      console.log(error instanceof Error ? error.message : "Network error");
      return null;
    }
  }

  // Auth API
  authApi = {
    freeTierSignUp: async (data: {
      email: string;
      password: string;
    }): Promise<ApiResponse<User | null>> => {
      return this.request("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    checkoutSignup: async (data: {
      email: string;
      password: string;
      plan: paidPlans;
    }): Promise<ApiResponse<{ sessionId: string; url: string } | null>> => {
      return this.request("/stripe/checkout/signup", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    premiumTierSignUp: async (data: {
      email: string;
      password: string;
    }): Promise<ApiResponse<{ sessionId: string; url: string } | null>> => {
      return this.request("/stripe/create-subscription-checkout/premium", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    enterpriseTierSignUp: async (data: {
      email: string;
      password: string;
    }): Promise<ApiResponse<{ sessionId: string; url: string } | null>> => {
      return this.request("/stripe/create-subscription-checkout/enterprise", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    signIn: async (data: {
      email: string;
      password: string;
    }): Promise<
      ApiResponse<{ userId: string; email: string; userType: string } | null>
    > => {
      const response: ApiResponse<{
        userId: string;
        email: string;
        userType: string;
      } | null> = await this.request(
        "/auth/sign-in",
        {
          method: "POST",
          body: JSON.stringify(data),
        },
        true,
      );

      if (response.success && response.data)
        await this.setUserData(response.data.userId, response.data.email);

      return response;
    },
    signOut: async () => {
      return this.request("/auth/sign-out", {
        method: "POST",
      });
    },
    createSocketTicket: async (): Promise<
      ApiResponse<{ ticket: string } | null>
    > => {
      const response: ApiResponse<{ ticket: string } | null> =
        await this.request("/auth/socket-ticket");
      return response;
    },
  };

  // Stripe API
  stripeApi = {
    checkoutUpgrade: async (data: {
      plan: paidPlans;
    }): Promise<ApiResponse<{ sessionId: string; url: string } | null>> => {
      return this.request("/stripe/checkout/upgrade", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    getBilling: async (): Promise<ApiResponse<BillingOverview | null>> => {
      return this.request("/stripe/billing", { cache: "no-store" });
    },
    cancelSubscription: async (): Promise<ApiResponse<unknown>> => {
      return this.request("/stripe/subscription/cancel", { method: "POST" });
    },
    resumeSubscription: async (): Promise<ApiResponse<unknown>> => {
      return this.request("/stripe/subscription/resume", { method: "POST" });
    },
    createPortalSession: async (): Promise<
      ApiResponse<{ url: string } | null>
    > => {
      return this.request("/stripe/billing/portal", { method: "POST" });
    },
  };

  // User API
  userApi = {
    getMe: async (): Promise<ApiResponse<User | null>> => {
      const userId = (await this.readCookie("user_id")) ?? "anon";
      const response: ApiResponse<User | null> = await this.request(
        "/users/me/user",
        {
          next: { tags: ["me", userId, `me-${userId}`] },
        },
      );
      return response;
    },
    getMeInfo: async (): Promise<ApiResponse<UserInformation | null>> => {
      const userId = (await this.readCookie("user_id")) ?? "anon";
      const response: ApiResponse<UserInformation | null> = await this.request(
        "/users/me/info",
        {
          next: { tags: ["meInfo", userId, `meInfo-${userId}`] },
        },
      );

      return response;
    },
    saveUserInfo: async (
      data: UserInformation,
    ): Promise<ApiResponse<UserInformation | null>> => {
      const response: ApiResponse<UserInformation | null> = await this.request(
        "/users/me/info",
        {
          method: "POST",
          body: JSON.stringify(data),
        },
      );
      return response;
    },
    saveOnboardingInfo: async (
      data: OnboardingInfo,
    ): Promise<ApiResponse<OnboardingInfo | null>> => {
      const response: ApiResponse<OnboardingInfo | null> = await this.request(
        "/users/me/org/onboarding",
        {
          method: "POST",
          body: JSON.stringify(data),
        },
      );
      return response;
    },
    saveMemberOnboardingInfo: async (data: {
      token: string;
      password: string;
      userInfo: UserInformation;
    }): Promise<ApiResponse<null | InviteValidationResult>> => {
      const response: ApiResponse<null | InviteValidationResult> =
        await this.request("/users/me/member/onboarding", {
          method: "POST",
          body: JSON.stringify(data),
        });
      return response;
    },
  };

  // Organization API
  organizationApi = {
    sendInviteEmail: async (
      data: SendInviteEmailPayload,
    ): Promise<ApiResponse<null>> => {
      const response: ApiResponse<null> = await this.request(
        "/organizations/send-invite-email",
        {
          method: "POST",
          body: JSON.stringify(data),
        },
      );
      return response;
    },
    resendInviteEmail: async (
      token: string,
    ): Promise<ApiResponse<OrgInvite | null>> => {
      const response: ApiResponse<OrgInvite | null> = await this.request(
        `/organizations/invites/${token}/resend`,
        {
          method: "PUT",
        },
      );
      return response;
    },
    revokeInvite: async (
      token: string,
    ): Promise<ApiResponse<OrgInvite | null>> => {
      const response: ApiResponse<OrgInvite | null> = await this.request(
        `/organizations/invites/${token}/revoke`,
        {
          method: "DELETE",
          next: { tags: ["orgRevokedInvites"] },
        },
      );
      return response;
    },
    removeMember: async (
      memberId: string,
    ): Promise<ApiResponse<string | null>> => {
      const response: ApiResponse<string | null> = await this.request(
        `/organizations/members/${memberId}`,
        {
          method: "DELETE",
        },
      );
      return response;
    },
    acceptInvite: async (token: string): Promise<ApiResponse<null>> => {
      const response: ApiResponse<null> = await this.request(
        `/organizations/invites/${token}/accept`,
        {
          method: "POST",
        },
      );
      return response;
    },
    validateInviteToken: async (
      token: string | undefined,
    ): Promise<ApiResponse<InviteValidationResult | null>> => {
      if (!token) {
        return {
          success: false,
          message: "Invalid token",
          data: {
            status: "EXPIRED",
          },
        };
      }
      const response: ApiResponse<InviteValidationResult | null> =
        await this.request(
          `/organizations/invite/validate?token=${encodeURIComponent(token)}`,
          {
            method: "GET",
          },
        );
      if (response.data === null) {
        response.data = { status: "EXPIRED" };
      }
      return response;
    },
    getOrganizationMembers: async (): Promise<
      ApiResponse<OrgMember[] | null>
    > => {
      const response: ApiResponse<OrgMember[] | null> = await this.request(
        `/organizations/my/members`,
        {
          method: "GET",
          next: { tags: ["orgMembers"] },
        },
      );

      return response;
    },
    getInviteRecords: async (): Promise<ApiResponse<OrgInvite[] | null>> => {
      const response: ApiResponse<OrgInvite[] | null> = await this.request(
        `/organizations/my/invites`,
        {
          method: "GET",
        },
      );
      return response;
    },
    getPendingInviteRecords: async (): Promise<
      ApiResponse<OrgInvite[] | null>
    > => {
      const response: ApiResponse<OrgInvite[] | null> = await this.request(
        `/organizations/my/invites/pending`,
        {
          method: "GET",
          next: { tags: ["orgPendingInvites"] },
        },
      );
      return response;
    },
    getRevokedInviteRecords: async (): Promise<
      ApiResponse<OrgInvite[] | null>
    > => {
      const response: ApiResponse<OrgInvite[] | null> = await this.request(
        `/organizations/my/invites/revoked`,
        {
          method: "GET",
          next: { tags: ["orgRevokedInvites"] },
        },
      );
      return response;
    },
  };

  // Notifications API
  notificationsApi = {
    getMyNotifications: async (): Promise<
      ApiResponse<NotificationWithMetadata[] | null>
    > => {
      const response: ApiResponse<NotificationWithMetadata[] | null> =
        await this.request(`/notifications`, {
          next: { tags: ["myNotifications"] },
        });

      return response;
    },
    markAllRead: async (): Promise<ApiResponse<null>> => {
      const response: ApiResponse<null> = await this.request(
        "/notifications/read-all",
        {
          method: "PATCH",
        },
      );

      return response;
    },
    getSettings: async () => {
      const response = this.request<NotificationSettings>(
        "/notifications/settings",
        {
          method: "GET",
          cache: "no-store",
        },
      );
      return response;
    },
    updateSettings: async (data: Partial<NotificationSettings>) => {
      const response = this.request<NotificationSettings>(
        "/notifications/settings",
        {
          method: "PATCH",
          body: JSON.stringify(data),
        },
      );
      return response;
    },
  };
  supplierApi = {
    getSuppliers: async (params: {
      search?: string;
      page?: number;
      pageSize?: number;
    }): Promise<ApiResponse<PaginatedResponse<Supplier> | null>> => {
      const searchParams = new URLSearchParams();
      if (params.search) searchParams.set("search", params.search);
      if (params.page) searchParams.set("page", String(params.page));
      if (params.pageSize)
        searchParams.set("pageSize", String(params.pageSize));
      return this.request(`/suppliers?${searchParams.toString()}`, {
        next: { tags: ["suppliers"] },
      });
    },
    getSupplierOptions: async (): Promise<
      ApiResponse<SupplierOption[] | null>
    > => {
      return this.request("/suppliers/options");
    },
    createSupplier: async (
      data: SupplierInput,
    ): Promise<ApiResponse<Supplier | null>> => {
      return this.request("/suppliers", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    updateSupplier: async (
      id: string,
      data: SupplierInput,
    ): Promise<ApiResponse<Supplier | null>> => {
      return this.request(`/suppliers/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    deleteSupplier: async (id: string): Promise<ApiResponse<string | null>> => {
      return this.request(`/suppliers/${id}`, { method: "DELETE" });
    },
  };

  // Products API
  productApi = {
    getProducts: async (params: {
      search?: string;
      supplierId?: string;
      lowStock?: boolean;
      archived?: boolean;
      page?: number;
      pageSize?: number;
    }): Promise<ApiResponse<PaginatedResponse<Product> | null>> => {
      const searchParams = new URLSearchParams();
      if (params.search) searchParams.set("search", params.search);
      if (params.supplierId) searchParams.set("supplierId", params.supplierId);
      if (params.lowStock) searchParams.set("lowStock", "true");
      if (params.archived) searchParams.set("archived", "true");
      if (params.page) searchParams.set("page", String(params.page));
      if (params.pageSize)
        searchParams.set("pageSize", String(params.pageSize));
      return this.request(`/products?${searchParams.toString()}`, {
        next: { tags: ["products"] },
      });
    },
    getProduct: async (
      id: string,
    ): Promise<ApiResponse<ProductDetail | null>> => {
      return this.request(`/products/${id}`, {
        next: { tags: ["product", `product-${id}`] },
      });
    },
    getProductOptions: async (): Promise<
      ApiResponse<ProductOption[] | null>
    > => {
      return this.request("/products/options");
    },
    suggestSku: async (name: string): Promise<ApiResponse<string | null>> => {
      return this.request(
        `/products/sku/suggestion?name=${encodeURIComponent(name)}`,
      );
    },
    createProduct: async (
      data: Record<string, unknown>,
    ): Promise<ApiResponse<Product | null>> => {
      return this.request("/products", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    updateProduct: async (
      id: string,
      data: Record<string, unknown>,
    ): Promise<ApiResponse<Product | null>> => {
      return this.request(`/products/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    setArchived: async (
      id: string,
      archived: boolean,
    ): Promise<ApiResponse<string | null>> => {
      return this.request(
        `/products/${id}/${archived ? "archive" : "unarchive"}`,
        { method: "PATCH" },
      );
    },
    export: async (path: string): Promise<Response | null> => {
      const response = await this.requestWithRawResponse(path);
      return response;
    },
    postForm: async (
      path: string,
      formData: FormData,
    ): Promise<Response | null> =>
      this.requestWithRawResponse(
        path,
        {
          method: "POST",
          body: formData,
          cache: "no-store",
        },
        false,
        true,
      ),
  };
  stockMovementsApi = {
    getMovements: async (params: {
      productId?: string;
      type?: string;
      from?: string;
      to?: string;
      page?: number;
      pageSize?: number;
    }): Promise<ApiResponse<PaginatedResponse<StockMovement> | null>> => {
      const searchParams = new URLSearchParams();
      (["productId", "type", "from", "to"] as const).forEach(
        (k) => params[k] && searchParams.set(k, params[k]!),
      );
      if (params.page) searchParams.set("page", String(params.page));
      if (params.pageSize)
        searchParams.set("pageSize", String(params.pageSize));
      return this.request(`/stock-movements?${searchParams.toString()}`, {
        next: { tags: ["stockMovements"] },
      });
    },
    recordMovement: async (
      data: Record<string, unknown>,
    ): Promise<ApiResponse<StockMovement | null>> => {
      return this.request("/stock-movements", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    getMovementPage: async (
      id: string,
      pageSize: number,
    ): Promise<ApiResponse<{ page: number } | null>> => {
      return this.request(`/stock-movements/${id}/page?pageSize=${pageSize}`);
    },
    export: async (path: string): Promise<Response | null> => {
      const response = await this.requestWithRawResponse(path);
      return response;
    },
  };
  stockMovementRequestApi = {
    getRequests: async (params: {
      status?: string;
      page?: number;
      pageSize?: number;
    }): Promise<ApiResponse<PaginatedResponse<MovementRequest> | null>> => {
      const searchParams = new URLSearchParams();
      if (params.status) searchParams.set("status", params.status);
      if (params.page) searchParams.set("page", String(params.page));
      if (params.pageSize)
        searchParams.set("pageSize", String(params.pageSize));
      return this.request(
        `/stock-movement-requests?${searchParams.toString()}`,
        {
          next: { tags: ["stockMovementRequests"] },
        },
      );
    },
    createRequest: async (
      data: Record<string, unknown>,
    ): Promise<ApiResponse<MovementRequest | null>> => {
      return this.request("/stock-movement-requests", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    decide: async (
      id: string,
      decision: "approve" | "reject",
      decisionNote: string,
    ): Promise<ApiResponse<MovementRequest | null>> => {
      return this.request(`/stock-movement-requests/${id}/${decision}`, {
        method: "PATCH",
        body: JSON.stringify({ decisionNote }),
      });
    },
    cancelRequest: async (id: string): Promise<ApiResponse<string | null>> => {
      return this.request(`/stock-movement-requests/${id}`, {
        method: "DELETE",
      });
    },
  };
  dashboardApi = {
    getOverview: async (): Promise<ApiResponse<DashboardOverview | null>> => {
      return this.request("/dashboard/overview", {
        next: { tags: ["dashboardOverview"] },
      });
    },
  };
  settingsApi = {
    getProfile: async (): Promise<ApiResponse<UserInfo | null>> => {
      return this.request("/users/me/info");
    },
    getSecurity: async (): Promise<ApiResponse<SecurityInfo | null>> => {
      return this.request("/users/me/security");
    },
    getOrganization: async (): Promise<ApiResponse<MyOrganization | null>> => {
      return this.request("/organizations/me");
    },
    updateProfile: async (
      data: Record<string, unknown>,
    ): Promise<ApiResponse<UserInfo | null>> => {
      return this.request("/users/me/info", {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    changePassword: async (data: {
      currentPassword: string;
      newPassword: string;
    }): Promise<ApiResponse<null>> => {
      return this.request("/users/me/password", {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    revokeOtherSessions: async (): Promise<
      ApiResponse<{ count: number } | null>
    > => {
      return this.request("/auth/sessions/revoke-others", { method: "POST" });
    },
    updateOrganization: async (
      data: Record<string, unknown>,
    ): Promise<ApiResponse<MyOrganization | null>> => {
      return this.request("/organizations/me", {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
  };
}

export const nestJsEndpoints = new NestJsEndpoints();
