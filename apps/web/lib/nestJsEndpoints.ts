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
      return this.request("/users/auth/sign-out");
    },
  };

  // User API
  userApi = {
    getMeInfo: async (): Promise<ApiResponse<UserInformation | null>> => {
      await this.initFromCookies();
      const response: ApiResponse<UserInformation | null> =
        await this.request("/users/me/info", {next: {tags: ["meInfo", this.user_id!, `meInfo-${this.user_id!}`]}});

      return response;
    },
    saveUserInfo: async (data: UserInformation,
    ): Promise<ApiResponse<UserInformation | null>> => {
      await this.initFromCookies();
      const response: ApiResponse<UserInformation | null> =
        await this.request("/users/me/info", {
          method: "POST",
          body: JSON.stringify(data),
        });
      return response;
    },
    saveOnboardingInfo: async (data: OnboardingInfo,
    ): Promise<ApiResponse<OnboardingInfo | null>> => {
      await this.initFromCookies();
      const response: ApiResponse<OnboardingInfo | null> =
        await this.request("/users/me/onboarding", {
          method: "POST",
          body: JSON.stringify(data),
        });
      return response;
    }
  };

  // Organization API

  // Products API
}

export const nestJsEndpoints = new NestJsEndpoints();
