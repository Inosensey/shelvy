"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { freeTierSignUp, paidTierSignUp } from "@/actions/authActions";
import type { PlanId } from "@/utils/plans";

const freeInitialFormState: ApiResponse<null> = {
  success: false,
  message: "",
  data: null,
};
const paidInitialFormState: ApiResponse<null | {
  sessionId: string;
  url: string;
}> = {
  success: false,
  message: "",
  data: null,
};

/**
 * Owns everything about reacting to a registration submission for the
 * current plan: the three per-tier useActionState calls, which one is
 * "active" based on the selected plan, and what happens on success/failure
 * (message + redirect for FREE, message + Stripe handoff for PREMIUM/
 * ENTERPRISE). RegisterForm just needs formAction/isPending/isSuccess/
 * submitMessage back -- it doesn't need to know there are three actions
 * under the hood at all.
 */
export function useRegisterResponseHandler(plan: PlanId) {
  const router = useRouter();

  const [freeTierFormState, freeTierFormAction, isFreePending] = useActionState(
    freeTierSignUp,
    freeInitialFormState,
  );
  const [paidTierFormState, paidTierFormAction, isPaidPending] = useActionState(
    paidTierSignUp,
    paidInitialFormState,
  );

  const [isSuccess, setIsSuccess] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  function handleResult(
    formState: typeof freeTierFormState | typeof paidTierFormState,
    onSuccess: () => (() => void) | void,
  ) {
    if (!formState.message) return;
    if (formState.success) {
      setIsSuccess(true);
      return onSuccess();
    }
    setIsSuccess(false);
    setSubmitMessage(formState.message);
  }

  useEffect(() => {
    if (plan === "FREE") {
      return handleResult(freeTierFormState, () => {
        setSubmitMessage("Account created! Redirecting you to sign in…");
        const timer = setTimeout(() => router.push("/login"), 1500);
        return () => clearTimeout(timer);
      });
    }
    return handleResult(paidTierFormState, () => {
      setSubmitMessage(paidTierFormState.message);
      const timer = setTimeout(
        () => (window.location.href = paidTierFormState.data!.url),
        1500,
      );
      return () => clearTimeout(timer);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freeTierFormState, paidTierFormState]);

  const formAction = plan === "FREE" ? freeTierFormAction : paidTierFormAction;
  const isPending = plan === "FREE" ? isFreePending : isPaidPending;

  return { formAction, isPending, isSuccess, submitMessage };
}
