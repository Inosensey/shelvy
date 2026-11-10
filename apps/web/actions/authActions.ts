"use server";

import { checkValidations, validateGroupInput } from "@/utils/validation";
import { registerValidationRules } from "../utils/validationRules";
import { redirect } from "next/navigation";
import { nestJsEndpoints } from "@/lib/nestJsEndpoints";
import { cookies } from "next/headers";

const PAID_PLAN_VALUES = {
  PREMIUM: "PREMIUM",
  ENTERPRISE: "ENTERPRISE",
} as const;

function readCredentials(formData: FormData) {
  const email = (formData.get("email") as string) ?? "";
  const password = (formData.get("password") as string) ?? "";

  const results = validateGroupInput(
    { email, password },
    registerValidationRules,
  );
  if (!checkValidations(results)) {
    const message = Object.values(results)
      .filter((r) => r.valid === false)
      .map((r) => r.validationMessage)
      .join("\n");
    return { ok: false as const, message };
  }
  return { ok: true as const, email, password };
}

export const paidTierSignUp = async (
  prevState: ApiResponse<null>,
  formData: FormData,
): Promise<ApiResponse<{ sessionId: string; url: string } | null>> => {
  const credentials = readCredentials(formData);
  if (!credentials.ok) {
    return { success: false, data: null, message: credentials.message };
  }

  // Whitelist on our side too; never forward the raw form value
  const planKey = formData.get("plan")?.toString() as
    keyof typeof PAID_PLAN_VALUES | undefined;
  const plan: paidPlans = planKey ? PAID_PLAN_VALUES[planKey] : undefined;
  if (!plan) {
    return {
      success: false,
      data: null,
      message: "Please choose a paid plan.",
    };
  }

  try {
    const res = await nestJsEndpoints.authApi.checkoutSignup({
      email: credentials.email,
      password: credentials.password,
      plan,
    });
    if (!res.success) return res;

    return {
      success: true,
      data: res.data as { sessionId: string; url: string },
      message:
        "🔗 Checkout session created successfully! Connecting to Stripe...",
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      data: null,
      message:
        error instanceof Error
          ? `There is an error Signing up: ${error.message}`
          : "An unknown error occurred",
    };
  }
};

export const freeTierSignUp = async (
  prevState: ApiResponse<null>,
  formData: FormData,
): Promise<ApiResponse<User | null>> => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const values = {
    email,
    password,
  };

  const validationResults = validateGroupInput(values, registerValidationRules);
  const isValid = checkValidations(validationResults);

  if (!isValid) {
    const message: string[] = [];
    for (const [key, result] of Object.entries(validationResults)) {
      if (result.valid === false) {
        message.push(result.validationMessage);
      }
    }
    return {
      success: false,
      data: null,
      message: message.join("\n"),
    };
  }

  const payload = {
    email,
    password,
  };

  try {
    const signUpResponse =
      await nestJsEndpoints.authApi.freeTierSignUp(payload);

    if (!signUpResponse.success) {
      return signUpResponse;
    }

    return {
      success: true,
      data: signUpResponse.data as User,
      message: "Account created! Redirecting you to sign in…",
    };
  } catch (error) {
    console.log(error);
    const errorMessage: string =
      error instanceof Error
        ? `There is an error Signing up: ${error.message}`
        : "An unknown error occurred";
    return {
      success: false,
      data: null,
      message: errorMessage,
    };
  }
};

export const signIn = async (
  prevState: ApiResponse<{ userId: string } | null>,
  formData: FormData,
): Promise<ApiResponse<{ userId: string } | null>> => {
  const email = formData.get("email")?.toString() ?? "";
  const password = formData.get("loginPassword")?.toString() ?? "";

  const values = {
    email,
    password,
  };

  const validationResults = validateGroupInput(values, registerValidationRules);
  const isValid = checkValidations(validationResults);

  if (!isValid) {
    const message: string[] = [];
    for (const [key, result] of Object.entries(validationResults)) {
      if (result.valid === false) {
        message.push(result.validationMessage);
      }
    }
    return {
      success: false,
      data: null,
      message: message.join("\n"),
    };
  }

  const payload = {
    email,
    password,
  };

  try {
    nestJsEndpoints.onResponse(async (headers) => {
      const setCookieHeader = headers.get("set-cookie");
      if (setCookieHeader) {
        const cookieStore = await cookies();
        const tokenMatch = setCookieHeader.match(/token=([^;]+)/);
        if (tokenMatch) {
          const token = tokenMatch[1];
          console.log(token);
          cookieStore.set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60,
            path: "/",
          });
          nestJsEndpoints.setServerToken(token);
        }
      }
    });

    const response = await nestJsEndpoints.authApi.signIn(payload);

    if (!response.success) {
      return response;
    }

    return response;
  } catch (error) {
    console.log(error);
    const errorMessage: string =
      error instanceof Error
        ? `There is an error Signing in: ${error.message}`
        : "An unknown error occurred";
    return {
      success: false,
      data: null,
      message: errorMessage,
    };
  }
};

export const signOut = async (
  redirectTo?: string,
): Promise<ApiResponse<null>> => {
  const cookieStore = await cookies();
  try {
    const response = await nestJsEndpoints.authApi.signOut();

    if (!response.success) {
      console.error("Backend sign out error:", response.message);
    }

    cookieStore.delete("token");
    cookieStore.delete("user_id");
    cookieStore.delete("email");
    nestJsEndpoints.setServerToken(null);

    return {
      success: true,
      data: null,
      message: "Signed out successfully",
    };
  } catch (error) {
    console.error("Sign out error:", error);

    cookieStore.delete("token");

    const errorMessage: string =
      error instanceof Error
        ? `Error signing out: ${error.message}`
        : "An unknown error occurred";

    return {
      success: false,
      data: null,
      message: errorMessage,
    };
  } finally {
    redirect(redirectTo ? redirectTo : "/login");
  }
};
