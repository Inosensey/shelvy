"use server";

import { nestJsEndpoints } from "@/lib/nestJsEndpoints";
import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const completeOnboarding = async (
  prevState: ApiResponse<OnboardingInfo | null>,
  formData: FormData,
): Promise<ApiResponse<OnboardingInfo | null>> => {
  const cookieStore = await cookies();
  const userId = cookieStore.get("user_id")?.value;
  const firstName = formData.get("firstName") as string;
  const middleName = formData.get("middleName") as string;
  const lastName = formData.get("lastName") as string;
  const suffix = formData.get("suffix") as string;
  const birthDate = formData.get("birthDate") as string;
  const gender = formData.get("gender") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const city = formData.get("city") as string;
  const state = formData.get("state") as string;
  const country = formData.get("country") as string;
  const postalCode = formData.get("postalCode") as string;
  const organizationName = formData.get("organizationName") as string;
  const organizationDescription = formData.get(
    "organizationDescription",
  ) as string;

  const userInfo: UserInformation = {
    firstName,
    middleName,
    lastName,
    suffix,
    birthDate,
    gender,
    phone,
    address,
    city,
    state,
    country,
    postalCode,
  };
  const organization: Organization = {
    name: organizationName,
    description: organizationDescription,
  };

  const payload: OnboardingInfo = {
    userInfo,
    organization,
  };

  try {
    const response = await nestJsEndpoints.userApi.saveOnboardingInfo(payload);

    if (!response.success) {
      return response;
    }
    updateTag(`meInfo-${userId}`);

    return {
      success: true,
      data: response.data,
      message: "🔗 Onboarding successfully save, Redirecting to Dashboard...",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Something went wrong on saving your onboarding information.",
      data: null,
    };
  }
};

export const completeMemberOnboarding = async (
  _prevState: ApiResponse<null>,
  formData: FormData,
): Promise<ApiResponse<null | InviteValidationResult>> => {
  const token = formData.get("token") as string;
  const password = formData.get("password") as string;

  const firstName = formData.get("firstName") as string;
  const middleName = formData.get("middleName") as string;
  const lastName = formData.get("lastName") as string;
  const suffix = formData.get("suffix") as string;
  const birthDate = formData.get("birthDate") as string;
  const gender = formData.get("gender") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const city = formData.get("city") as string;
  const state = formData.get("state") as string;
  const country = formData.get("country") as string;
  const postalCode = formData.get("postalCode") as string;

  const userInfo: UserInformation = {
    firstName,
    middleName,
    lastName,
    suffix,
    birthDate,
    gender,
    phone,
    address,
    city,
    state,
    country,
    postalCode,
  };

  const payload = {
    token,
    password,
    userInfo,
  };

  const result =
    await nestJsEndpoints.organizationApi.validateInviteToken(token);
  const inviteStatus = String(result.data!.status);
  if (result.data!.status !== inviteStatus || !result.data?.invite) {
    return {
      success: false,
      message: "This invite is no longer valid. Refresh the page to see why.",
      data: { status: "EXPIRED" },
    };
  }

  try {
    const response =
      await nestJsEndpoints.userApi.saveMemberOnboardingInfo(payload);

    if (!response.success) {
      return response;
    }

    return {
      success: true,
      data: response.data,
      message: "🎉 Onboarding completed successfully! Redirecting to login...",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Something went wrong setting up your account.",
      data: null,
    };
  }

  redirect("/login"); // switch to "/dashboard" if the backend auto-authenticates
};

export async function acceptInvite(token: string): Promise<ApiResponse<null>> {
  try {
    const response = await nestJsEndpoints.organizationApi.acceptInvite(token);
    if (!response?.success) {
      return { success: false, message: response?.message ?? "Could not accept the invite.", data: null };
    }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Could not accept the invite.", data: null };
  }
  redirect("/dashboard"); // outside the try/catch: redirect() works by throwing
}
