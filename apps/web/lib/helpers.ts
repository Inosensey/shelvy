import { nestJsEndpoints } from "./nestJsEndpoints";

export const helpers = {
  getCurrentUserOrNull: async () => {
    try {
      const res = await nestJsEndpoints.userApi.getMe();
      return res?.success ? res.data : null;
    } catch {
      return null;
    }
  },
};
