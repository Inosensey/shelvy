"use server";

import { revalidatePath } from "next/cache";
import { nestJsEndpoints } from "@/lib/nestJsEndpoints";

const fail = (message: string): ApiResponse<null> => ({
  success: false,
  message,
  data: null,
});
const ok = (message: string): ApiResponse<null> => ({
  success: true,
  message,
  data: null,
});
const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

const UPGRADE_PLANS: Record<string, paidPlans> = {
  PREMIUM: "PREMIUM",
  ENTERPRISE: "ENTERPRISE",
};

export async function saveProfile(
  _prev: ApiResponse<null>,
  formData: FormData,
): Promise<ApiResponse<null>> {
  const firstName = text(formData, "firstName");
  const lastName = text(formData, "lastName");
  if (!firstName || !lastName) return fail("First and last name are required.");

  try {
    const response = await nestJsEndpoints.settingsApi.updateProfile({
      firstName,
      lastName,
      middleName: text(formData, "middleName"),
      suffix: text(formData, "suffix"),
      phone: text(formData, "phone"),
    });
    if (!response || !response.success)
      return fail(response?.message ?? "Could not save your profile.");
    revalidatePath("/dashboard", "layout"); // the topbar may show your name
    return ok("Profile updated.");
  } catch (e) {
    return fail(
      e instanceof Error ? e.message : "Could not save your profile.",
    );
  }
}

export async function changePassword(
  _prev: ApiResponse<null>,
  formData: FormData,
): Promise<ApiResponse<null>> {
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword) return fail("Enter your current password.");
  if (newPassword.length < 8)
    return fail("The new password must be at least 8 characters.");
  if (newPassword !== confirm) return fail("The new passwords don't match.");

  try {
    const response = await nestJsEndpoints.settingsApi.changePassword({
      currentPassword,
      newPassword,
    });
    if (!response || !response.success)
      return fail(response?.message ?? "Could not change your password.");
    revalidatePath("/dashboard/settings");
    return ok("Password changed. Other devices were signed out.");
  } catch (e) {
    return fail(
      e instanceof Error ? e.message : "Could not change your password.",
    );
  }
}

export async function revokeOtherSessions(): Promise<ApiResponse<null>> {
  try {
    const response = await nestJsEndpoints.settingsApi.revokeOtherSessions();
    if (!response || !response.success)
      return fail(response?.message ?? "Something went wrong.");
    revalidatePath("/dashboard/settings");
    return ok(response.message);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Something went wrong.");
  }
}

export async function saveOrganization(
  _prev: ApiResponse<null>,
  formData: FormData,
): Promise<ApiResponse<null>> {
  const name = text(formData, "name");
  if (!name) return fail("Organization name is required.");

  try {
    const response = await nestJsEndpoints.settingsApi.updateOrganization({
      name,
      description: text(formData, "description"),
    });
    if (!response || !response.success)
      return fail(response?.message ?? "Could not save the organization.");
    revalidatePath("/dashboard", "layout");
    return ok("Organization updated.");
  } catch (e) {
    return fail(
      e instanceof Error ? e.message : "Could not save the organization.",
    );
  }
}

export async function startUpgradeAction(
  planId: string,
): Promise<ApiResponse<{ url: string } | null>> {
  const plan = UPGRADE_PLANS[planId];
  if (!plan) return { success: false, message: "Invalid plan.", data: null };
  return nestJsEndpoints.stripeApi.checkoutUpgrade({ plan });
}

export async function cancelSubscriptionAction(): Promise<
  ApiResponse<unknown>
> {
  const res = await nestJsEndpoints.stripeApi.cancelSubscription();
  if (res.success) revalidatePath("/dashboard/settings");
  return res;
}

export async function resumeSubscriptionAction(): Promise<
  ApiResponse<unknown>
> {
  const res = await nestJsEndpoints.stripeApi.resumeSubscription();
  if (res.success) revalidatePath("/dashboard/settings");
  return res;
}

export async function openBillingPortalAction(): Promise<
  ApiResponse<{ url: string } | null>
> {
  return nestJsEndpoints.stripeApi.createPortalSession();
}

export async function updateNotificationSettingsAction(
  data: Partial<NotificationSettings>,
) {
  try {
    const saved = await nestJsEndpoints.notificationsApi.updateSettings(data);
    return { success: true as const, data: saved };
  } catch (error) {
    return {
      success: false as const,
      message:
        error instanceof Error ? error.message : "Failed to save settings",
    };
  }
}
