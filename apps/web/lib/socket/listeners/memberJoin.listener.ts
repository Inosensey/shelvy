import { Socket } from "socket.io-client";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { toast } from "sonner";
import {
  revalidateInviteCache,
  revalidateMemberCache,
} from "@/actions/teamActions";
import { revalidateNotificationCache } from "@/actions/revalidateAction";

interface MemberJoinedData {
  message: string;
}

export function memberJoinedListener(
  socket: Socket | null,
  router: AppRouterInstance,
) {
  if (!socket) return { cleanUp: () => {} };


  const eventName = "MEMBER_JOINED";

  const handleEvent = async (data: MemberJoinedData) => {
    toast.success(data.message);

    try {
      await revalidateInviteCache();
      await revalidateMemberCache();
      await revalidateNotificationCache();

      router.refresh();
    } catch (error) {
      console.error("Failed to clear real-time cache tags:", error);
      router.refresh();
    }
  };

  socket.on(eventName, handleEvent);

  return {
    cleanUp: () => {
      socket.off(eventName, handleEvent);
    },
  };
}
