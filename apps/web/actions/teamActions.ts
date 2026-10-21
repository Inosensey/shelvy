"use server";

import { nestJsEndpoints } from "@/lib/nestJsEndpoints";
import { revalidateTag, updateTag } from "next/cache";

export const inviteMember = async (
  prevState: ApiResponse<null>,
  formData: FormData,
): Promise<ApiResponse<null>> => {
  const email = formData.get("email") as string;
  const role = formData.get("role") as "MANAGER" | "STAFF";

  const payload = {
    recipientEmail: email,
    role: role,
  };

  try {
    const response =
      await nestJsEndpoints.organizationApi.sendInviteEmail(payload);

    if (!response.success) {
      return response;
    }

    updateTag("orgPendingInvites");

    return { success: true, message: `Invite sent to ${email}.`, data: null };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Something went wrong sending the invite.",
      data: null,
    };
  }
};

export async function revokeInviteRecord(
  token: string,
): Promise<ApiResponse<OrgInvite | null>> {
  try {
    console.log(token);

    const response = await nestJsEndpoints.organizationApi.revokeInvite(token);

    if (!response.success) {
      return response;
    }

    updateTag("orgPendingInvites");
    updateTag("orgRevokedInvites");
    return {
      success: true,
      message: `Invite for ${response.data?.email} is now Revoked`,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Something went wrong revoking the invite.",
      data: null,
    };
  }
}

export async function removeMember(
  memberId: string,
): Promise<ApiResponse<string | null>> {
  try {
    const response =
      await nestJsEndpoints.organizationApi.removeMember(memberId);

    console.log(response);

    if (!response.success) {
      return response;
    }

    updateTag("orgMembers");

    return response;
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Something went wrong removing the member.",
      data: null,
    };
  }
}

export async function resendInviteRecord(
  token: string,
): Promise<ApiResponse<OrgInvite | null>> {
  try {
    const response =
      await nestJsEndpoints.organizationApi.resendInviteEmail(token);

    console.log(response);

    if (!response.success) {
      return {
        success: false,
        message:
          response.message ?? "Something went wrong resending the invite.",
        data: null,
      };
    }

    updateTag("orgPendingInvites");
    updateTag("orgRevokedInvites");

    return {
      success: true,
      message: `Successfully resent an invite to ${response.data?.email}`,
      data: null,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Something went wrong resending the invite.",
      data: null,
    };
  }
}
export async function revalidateInviteCache() {
  revalidateTag("orgPendingInvites", "max");
  revalidateTag("orgRevokedInvites", "max");
}

export async function revalidateMemberCache() {
  revalidateTag("orgMembers", "max");
}
