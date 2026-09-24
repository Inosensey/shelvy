"use server";

import { nestJsEndpoints } from "@/lib/nestJsEndpoints";
import { updateTag } from "next/cache";
import { cookies } from "next/headers";

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
