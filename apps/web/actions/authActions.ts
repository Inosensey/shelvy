"use server";

import { checkValidations, validateGroupInput } from "@/utils/validation";
import { registerValidationRules } from "../utils/validationRules";
import { redirect } from "next/navigation";
import { nestJsEndpoints } from "@/lib/nestJsEndpoints";
import { cookies } from "next/headers";

// Stubs so the template runs end to end. Replace the bodies with your real
// NestJS calls (POST /auth/register, POST /stripe/register, POST /auth/login).

function toErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? `${fallback}: ${error.message}` : fallback;
}

// Stand-ins for your real endpoints.
async function registerFreeUser(payload: { email: string; password: string }) {
  await new Promise((resolve) => setTimeout(resolve, 800));
  // POST /auth/register -- creates the user directly, role: OWNER, plan: FREE
  void payload;
}

async function createStripeCheckoutSession(payload: {
  email: string;
  password: string;
  plan: "PREMIUM" | "ENTERPRISE";
}) {
  await new Promise((resolve) => setTimeout(resolve, 800));
  // POST /stripe/register -- hashes password, creates a Stripe Customer,
  // stashes { email, hashedPassword, plan } in the session metadata, and
  // returns the checkout URL to redirect to.
  void payload;
  return "https://checkout.stripe.com/pay/stub-session";
}

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

export const premiumTierSignUp = async (
  prevState: ApiResponse<null>,
  formData: FormData,
): Promise<ApiResponse<{ sessionId: string; url: string } | null>> => {
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
      await nestJsEndpoints.authApi.premiumTierSignUp(payload);

    if (!signUpResponse.success) {
      return signUpResponse;
    }

    return {
      success: true,
      data: signUpResponse.data as { sessionId: string; url: string },
      message:
        "🔗 Checkout session created successfully! Connecting to Stripe...",
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
export const enterpriseTierSignUp = async (
  prevState: ApiResponse<null>,
  formData: FormData,
): Promise<ApiResponse<{ sessionId: string; url: string } | null>> => {
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
      await nestJsEndpoints.authApi.enterpriseTierSignUp(payload);

    if (!signUpResponse.success) {
      return signUpResponse;
    }

    return {
      success: true,
      data: signUpResponse.data as { sessionId: string; url: string },
      message:
        "🔗 Checkout session created successfully! Connecting to Stripe...",
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
  const password = formData.get("password")?.toString() ?? "";

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

export const signOut = async (): Promise<ApiResponse<null>> => {
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
    redirect("/login");
  }
};
