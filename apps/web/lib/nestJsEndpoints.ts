import { cookies } from "next/headers";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

class NestJsEndpoints {
  private serverToken: string | null = null;
  private user_id: string | null = null;
  private email: string | null = null;
  private responseInterceptor: ((headers: Headers) => Promise<void>) | null =
    null;

  setServerToken(token: string | null) {
    this.serverToken = token;
  }

  onResponse(callback: (headers: Headers) => Promise<void>) {
    this.responseInterceptor = callback;
  }

  async initFromCookies() {
    const cookieStore = await cookies();
    this.setServerToken(cookieStore.get("token")?.value || null);
    this.user_id = cookieStore.get("user_id")?.value || null;
    this.email = cookieStore.get("email")?.value || null;
  }
  async clearUserData() {
    this.user_id = null;
    this.email = null;
    this.serverToken = null;

    const cookieStore = await cookies();
    cookieStore.delete("user_id");
    cookieStore.delete("email");
    cookieStore.delete("token");
  }

  async setUserData(userId: string, email: string) {
    this.user_id = userId;
    this.email = email;

    const cookieStore = await cookies();
    cookieStore.set("user_id", userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });
    cookieStore.set("email", email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (typeof window === "undefined" && this.serverToken) {
      headers.Cookie = `token=${this.serverToken}`;
    }

    return headers;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    interceptResponse: boolean = false,
  ): Promise<ApiResponse<T | null>> {
    try {
      const isServer = typeof window === "undefined";
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
        ...(isServer ? {} : { credentials: "include" as RequestCredentials }),
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

      if (interceptResponse && this.responseInterceptor) {
        await this.responseInterceptor(response.headers);
      }

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
    interceptResponse: boolean = false,
  ) {
    try {
      const isServer = typeof window === "undefined";

      const headers = new Headers(this.getHeaders());
      new Headers(options.headers).forEach((value, key) =>
        headers.set(key, value),
      );

      if (options.body instanceof FormData) headers.delete("content-type");

      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
        ...(isServer ? {} : { credentials: "include" as RequestCredentials }),
        mode: "cors",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log(errorData.message || `HTTP ${response.status}`);
        return null;
      }

      if (interceptResponse && this.responseInterceptor) {
        await this.responseInterceptor(response.headers);
      }

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
      await this.initFromCookies();
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
      await this.initFromCookies();
      return this.request("/stripe/checkout/upgrade", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    getBilling: async (): Promise<ApiResponse<BillingOverview | null>> => {
      await this.initFromCookies();
      return this.request("/stripe/billing", { cache: "no-store" });
    },
    cancelSubscription: async (): Promise<ApiResponse<unknown>> => {
      await this.initFromCookies();
      return this.request("/stripe/subscription/cancel", { method: "POST" });
    },
    resumeSubscription: async (): Promise<ApiResponse<unknown>> => {
      await this.initFromCookies();
      return this.request("/stripe/subscription/resume", { method: "POST" });
    },
    createPortalSession: async (): Promise<
      ApiResponse<{ url: string } | null>
    > => {
      await this.initFromCookies();
      return this.request("/stripe/billing/portal", { method: "POST" });
    },
  };

  // User API
  userApi = {
    getMe: async (): Promise<ApiResponse<User | null>> => {
      await this.initFromCookies();
      const response: ApiResponse<User | null> = await this.request(
        "/users/me/user",
        {
          next: { tags: ["me", this.user_id!, `me-${this.user_id!}`] },
        },
      );
      return response;
    },
    getMeInfo: async (): Promise<ApiResponse<UserInformation | null>> => {
      await this.initFromCookies();
      const response: ApiResponse<UserInformation | null> = await this.request(
        "/users/me/info",
        {
          next: { tags: ["meInfo", this.user_id!, `meInfo-${this.user_id!}`] },
        },
      );

      return response;
    },
    saveUserInfo: async (
      data: UserInformation,
    ): Promise<ApiResponse<UserInformation | null>> => {
      await this.initFromCookies();
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
      await this.initFromCookies();
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
      await this.initFromCookies();
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
      await this.initFromCookies();
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
      await this.initFromCookies();
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
      await this.initFromCookies();
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
      await this.initFromCookies();
      const response: ApiResponse<string | null> = await this.request(
        `/organizations/members/${memberId}`,
        {
          method: "DELETE",
        },
      );
      return response;
    },
    acceptInvite: async (token: string): Promise<ApiResponse<null>> => {
      await this.initFromCookies();
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
      await this.initFromCookies();
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
      await this.initFromCookies();
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
      await this.initFromCookies();
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
      await this.initFromCookies();
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
      await this.initFromCookies();
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
      await this.initFromCookies();
      const response: ApiResponse<NotificationWithMetadata[] | null> =
        await this.request(`/notifications`, {
          next: { tags: ["myNotifications"] },
        });

      return response;
    },
    markAllRead: async (): Promise<ApiResponse<null>> => {
      await this.initFromCookies();
      const response: ApiResponse<null> = await this.request(
        "/notifications/read-all",
        {
          method: "PATCH",
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
      await this.initFromCookies();
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
      await this.initFromCookies();
      return this.request("/suppliers/options");
    },
    createSupplier: async (
      data: SupplierInput,
    ): Promise<ApiResponse<Supplier | null>> => {
      await this.initFromCookies();
      return this.request("/suppliers", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    updateSupplier: async (
      id: string,
      data: SupplierInput,
    ): Promise<ApiResponse<Supplier | null>> => {
      await this.initFromCookies();
      return this.request(`/suppliers/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    deleteSupplier: async (id: string): Promise<ApiResponse<string | null>> => {
      await this.initFromCookies();
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
      await this.initFromCookies();
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
      await this.initFromCookies();
      return this.request(`/products/${id}`, {
        next: { tags: ["product", `product-${id}`] },
      });
    },
    getProductOptions: async (): Promise<
      ApiResponse<ProductOption[] | null>
    > => {
      await this.initFromCookies();
      return this.request("/products/options");
    },
    suggestSku: async (name: string): Promise<ApiResponse<string | null>> => {
      await this.initFromCookies();
      return this.request(
        `/products/sku/suggestion?name=${encodeURIComponent(name)}`,
      );
    },
    createProduct: async (
      data: Record<string, unknown>,
    ): Promise<ApiResponse<Product | null>> => {
      await this.initFromCookies();
      return this.request("/products", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    updateProduct: async (
      id: string,
      data: Record<string, unknown>,
    ): Promise<ApiResponse<Product | null>> => {
      await this.initFromCookies();
      return this.request(`/products/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    setArchived: async (
      id: string,
      archived: boolean,
    ): Promise<ApiResponse<string | null>> => {
      await this.initFromCookies();
      return this.request(
        `/products/${id}/${archived ? "archive" : "unarchive"}`,
        { method: "PATCH" },
      );
    },
    export: async (path: string): Promise<Response | null> => {
      await this.initFromCookies();
      const response = await this.requestWithRawResponse(path);
      console.log("response:", response);
      return response;
    },
    postForm: async (
      path: string,
      formData: FormData,
    ): Promise<Response | null> => {
      await this.initFromCookies();
      const headers = new Headers(this.getHeaders() as HeadersInit);
      headers.delete("content-type");

      return this.requestWithRawResponse(path, {
        method: "POST",
        headers,
        body: formData,
        cache: "no-store",
      });
    },
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
      await this.initFromCookies();
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
      await this.initFromCookies();
      return this.request("/stock-movements", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    getMovementPage: async (
      id: string,
      pageSize: number,
    ): Promise<ApiResponse<{ page: number } | null>> => {
      await this.initFromCookies();
      return this.request(`/stock-movements/${id}/page?pageSize=${pageSize}`);
    },
    export: async (path: string): Promise<Response | null> => {
      await this.initFromCookies();
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
      await this.initFromCookies();
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
      await this.initFromCookies();
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
      await this.initFromCookies();
      return this.request(`/stock-movement-requests/${id}/${decision}`, {
        method: "PATCH",
        body: JSON.stringify({ decisionNote }),
      });
    },
    cancelRequest: async (id: string): Promise<ApiResponse<string | null>> => {
      await this.initFromCookies();
      return this.request(`/stock-movement-requests/${id}`, {
        method: "DELETE",
      });
    },
  };
  dashboardApi = {
    getOverview: async (): Promise<ApiResponse<DashboardOverview | null>> => {
      await this.initFromCookies();
      return this.request("/dashboard/overview", {
        next: { tags: ["dashboardOverview"] },
      });
    },
  };
  settingsApi = {
    getProfile: async (): Promise<ApiResponse<UserInfo | null>> => {
      await this.initFromCookies();
      return this.request("/users/me/info");
    },
    getSecurity: async (): Promise<ApiResponse<SecurityInfo | null>> => {
      await this.initFromCookies();
      return this.request("/users/me/security");
    },
    getOrganization: async (): Promise<ApiResponse<MyOrganization | null>> => {
      await this.initFromCookies();
      return this.request("/organizations/me");
    },
    updateProfile: async (
      data: Record<string, unknown>,
    ): Promise<ApiResponse<UserInfo | null>> => {
      await this.initFromCookies();
      return this.request("/users/me/info", {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    changePassword: async (data: {
      currentPassword: string;
      newPassword: string;
    }): Promise<ApiResponse<null>> => {
      await this.initFromCookies();
      return this.request("/users/me/password", {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    revokeOtherSessions: async (): Promise<
      ApiResponse<{ count: number } | null>
    > => {
      await this.initFromCookies();
      return this.request("/auth/sessions/revoke-others", { method: "POST" });
    },
    updateOrganization: async (
      data: Record<string, unknown>,
    ): Promise<ApiResponse<MyOrganization | null>> => {
      await this.initFromCookies();
      return this.request("/organizations/me", {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
  };
}

export const nestJsEndpoints = new NestJsEndpoints();
