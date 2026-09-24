"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { motion } from "motion/react";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthButton } from "@/components/auth/AuthButton";
import { PlanSelector } from "@/components/auth/PlanSelector";
import { TestCardModal } from "@/components/reusable/TestCardModal";
import { useRegisterResponseHandler } from "@/hooks/useRegisterResponseHandler";
import { registerValidationRules } from "@/utils/validationRules";
import { validateGroupInput, checkValidations } from "@/utils/validation";
import type { formValidation } from "@/utils/validation.types";
import type { PlanId } from "@/utils/plans";
import { FormMessage } from "../reusable/FormMessage";

interface RegisterFormProps {
  initialPlan?: PlanId;
}

const initialValidation: formValidation = {
  email: { validationName: "email", valid: true, validationMessage: "" },
  password: { validationName: "password", valid: true, validationMessage: "" },
};

export function RegisterForm({ initialPlan = "FREE" }: RegisterFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const hasConfirmedSandboxCard = useRef(false);

  const [plan, setPlan] = useState<PlanId>(initialPlan);
  const [values, setValues] = useState({ email: "", password: "" });
  const [validation, setValidation] =
    useState<formValidation>(initialValidation);
  const [showTestCardModal, setShowTestCardModal] = useState(false);

  // Custom hook to handle the response from the registration form submission
  const { formAction, isPending, isSuccess, submitMessage } =
    useRegisterResponseHandler(plan);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));

    const rule =
      registerValidationRules[name as keyof typeof registerValidationRules];
    if (rule) {
      setValidation((prev) => ({ ...prev, [name]: rule(value) }));
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const results = validateGroupInput(values, registerValidationRules);
    const isValid = checkValidations(results, setValidation);
    if (!isValid) {
      e.preventDefault();
      return;
    }

    if (plan !== "FREE" && !hasConfirmedSandboxCard.current) {
      e.preventDefault();
      setShowTestCardModal(true);
    }
  }

  function handleTestCardConfirm() {
    hasConfirmedSandboxCard.current = true;
    setShowTestCardModal(false);
    formRef.current?.requestSubmit();
  }

  const isPaidPlan = plan !== "FREE";
  const loadingText = isPending
    ? isPaidPlan
      ? "Creating checkout session…"
      : "Creating account…"
    : isPaidPlan
      ? "Redirecting to checkout…"
      : "Redirecting to sign in page…";

  return (
    <>
      <form
        ref={formRef}
        action={formAction}
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col gap-6"
      >
        <PlanSelector value={plan} onChange={setPlan} />

        <motion.fieldset
          disabled={isPending}
          animate={{ opacity: isPending ? 0.6 : 1 }}
          transition={{ duration: 0.2 }}
          className="m-0 flex flex-col gap-4 border-0 p-0"
        >
          <AuthInput
            id="email"
            name="email"
            type="email"
            label="Email address"
            autoComplete="email"
            value={values.email}
            onChange={handleChange}
            valid={validation.email.valid}
            validationMessage={validation.email.validationMessage}
          />

          <AuthInput
            id="password"
            name="password"
            type="password"
            label="Password"
            autoComplete="new-password"
            value={values.password}
            onChange={handleChange}
            valid={validation.password.valid}
            validationMessage={validation.password.validationMessage}
          />
        </motion.fieldset>

        <FormMessage message={submitMessage} success={isSuccess} />

        <p className="text-xs leading-relaxed text-linen/45">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="text-clay hover:underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-clay hover:underline">
            Privacy Policy
          </Link>
          .
        </p>

        <AuthButton
          type="submit"
          loading={isPending || isSuccess}
          loadingText={loadingText}
        >
          {isPaidPlan ? "Continue to payment" : "Create free account"}
        </AuthButton>
      </form>

      {isPaidPlan && (
        <TestCardModal
          open={showTestCardModal}
          onClose={() => setShowTestCardModal(false)}
          onConfirm={handleTestCardConfirm}
        />
      )}
    </>
  );
}
