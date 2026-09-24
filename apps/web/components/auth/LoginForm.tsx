"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "nextjs-toploader/app";
import { motion } from "motion/react";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthButton } from "@/components/auth/AuthButton";
import { signIn } from "@/actions/authActions";
import { loginValidationRules } from "@/utils/validationRules";
import { validateGroupInput, checkValidations } from "@/utils/validation";
import type { formValidation } from "@/utils/validation.types";
import { FormMessage } from "../reusable/FormMessage";

const initialFormState: ApiResponse<{ userId: string } | null> = {
  success: false,
  message: "",
  data: null,
};

const initialValidation: formValidation = {
  email: { validationName: "email", valid: true, validationMessage: "" },
  password: { validationName: "password", valid: true, validationMessage: "" },
};

export function LoginForm() {
  const router = useRouter();

  const [formState, formAction, isPending] = useActionState(signIn, initialFormState);

  const [values, setValues] = useState({ email: "", password: "" });
  const [validation, setValidation] = useState<formValidation>(initialValidation);
  const [submitMessage, setSubmitMessage] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));

    const rule = loginValidationRules[name as keyof typeof loginValidationRules];
    if (rule) {
      setValidation((prev) => ({ ...prev, [name]: rule(value) }));
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const results = validateGroupInput(values, loginValidationRules);
    const isValid = checkValidations(results, setValidation);
    if (!isValid) {
      e.preventDefault();
    }
  }

  useEffect(() => {
    if (!formState.message) return;

    if (formState.success) {
      setSubmitMessage(formState.message);
      const timer = setTimeout(() => router.push("/dashboard"), 1200);
      return () => clearTimeout(timer);
    }

    setSubmitMessage(formState.message);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formState]);

  return (
    <form action={formAction} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
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
          autoComplete="current-password"
          value={values.password}
          onChange={handleChange}
          valid={validation.password.valid}
          validationMessage={validation.password.validationMessage}
        />
      </motion.fieldset>

      {submitMessage && (
        
<FormMessage message={submitMessage} success={formState.success} />
      )}

      <AuthButton type="submit" loading={isPending || formState.success} loadingText="Signing in…" className="mt-1">
        Sign in
      </AuthButton>
    </form>
  );
}
