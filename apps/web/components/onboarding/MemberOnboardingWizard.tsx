// components/invite/MemberOnboardingWizard.tsx
"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthButton } from "@/components/auth/AuthButton";
import { FormMessage } from "@/components/reusable/FormMessage";
import { completeMemberOnboarding } from "@/actions/onboardingActions";
import FormValidation, {
  validateGroupInput,
  checkValidations,
} from "@/utils/validation";
import type { formValidation } from "@/utils/validation.types";

type StepId = "credentials" | "personal";
const STEPS: { id: StepId; label: string }[] = [
  { id: "credentials", label: "Set password" },
  { id: "personal", label: "Your info" },
];

const initialFormState: ApiResponse<null> = {
  success: false,
  message: "",
  data: null,
};
const initialValidation: formValidation = {
  password: { validationName: "password", valid: true, validationMessage: "" },
  firstName: {
    validationName: "firstName",
    valid: true,
    validationMessage: "",
  },
  middleName: {
    validationName: "middleName",
    valid: true,
    validationMessage: "",
  },
  lastName: { validationName: "lastName", valid: true, validationMessage: "" },
};

interface MemberOnboardingWizardProps {
  token: string;
  email: string;
}

export function MemberOnboardingWizard({
  token,
  email,
}: MemberOnboardingWizardProps) {
  const router = useRouter();
  const [formState, formAction, isPending] = useActionState(
    completeMemberOnboarding,
    initialFormState,
  );

  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState({
    password: "",
    firstName: "",
    middleName: "",
    lastName: "",
    suffix: "",
    birthDate: "",
    gender: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
  });
  const [validation, setValidation] =
    useState<formValidation>(initialValidation);

  const currentStep = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;
  const isBusy = isPending || formState.success;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (name in validation) {
      setValidation((prev) => ({
        ...prev,
        [name]: FormValidation({ stateName: name, value }),
      }));
    }
  }

  function validateCurrentStep(): boolean {
    if (currentStep.id === "credentials") {
      const result = FormValidation({
        stateName: "password",
        value: values.password,
      });
      setValidation((prev) => ({ ...prev, password: result }));
      return result.valid;
    }
    const rules = {
      firstName: (v: string) =>
        FormValidation({ stateName: "firstName", value: v }),
      lastName: (v: string) =>
        FormValidation({ stateName: "lastName", value: v }),
      middleName: (v: string) =>
        FormValidation({ stateName: "middleName", value: v }),
    };
    const results = validateGroupInput(
      {
        firstName: values.firstName,
        middleName: values.middleName,
        lastName: values.lastName,
      },
      rules,
    );
    return checkValidations(results, setValidation);
  }

  function handleNext() {
    if (!validateCurrentStep()) return;
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }
  function handleBack() {
    setStepIndex((i) => Math.max(i - 1, 0));
  }
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!isLastStep) {
      e.preventDefault();
      handleNext();
      return;
    }
    if (!validateCurrentStep()) e.preventDefault();
  }

  useEffect(() => {
    if (!formState.message || !formState.success) return;
    const timer = setTimeout(() => router.push("/login"), 1200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formState]);

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-6"
    >
      <input type="hidden" name="token" value={token} />

      <div className="flex items-center gap-2">
        {STEPS.map((step, i) => (
          <div key={step.id} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium ${i <= stepIndex ? "bg-clay text-ink" : "bg-linen/10 text-linen/40"}`}
            >
              {i + 1}
            </div>
            <span
              className={`text-xs ${i <= stepIndex ? "text-linen" : "text-linen/40"}`}
            >
              {step.label}
            </span>
            {i < STEPS.length - 1 && (
              <div className="h-px flex-1 bg-linen/10" />
            )}
          </div>
        ))}
      </div>

      <motion.fieldset
        disabled={isBusy}
        animate={{ opacity: isBusy ? 0.6 : 1 }}
        transition={{ duration: 0.2 }}
        className="m-0 flex flex-col gap-4 border-0 p-0"
      >
        <AnimatePresence mode="wait">
          {currentStep.id === "credentials" ? (
            <motion.div
              key="credentials"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-4"
            >
              {/* readOnly, not disabled -- disabled drops the field from FormData, readOnly keeps it while still locking the invite's email. */}
              <AuthInput
                id="email"
                name="email"
                type="email"
                label="Email address"
                value={email}
                readOnly
                tabIndex={-1}
              />
              <AuthInput
                id="password"
                name="password"
                type="password"
                label="Create a password"
                autoComplete="new-password"
                value={values.password}
                onChange={handleChange}
                valid={validation.password.valid}
                validationMessage={validation.password.validationMessage}
              />
            </motion.div>
          ) : (
            <motion.div
              key="personal"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-5"
            >
              <motion.div
                key="personal"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col gap-5"
              >
                <div className="flex flex-col gap-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-linen/40">
                    Name
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <AuthInput
                      id="firstName"
                      name="firstName"
                      type="text"
                      label="First name"
                      autoComplete="given-name"
                      value={values.firstName}
                      onChange={handleChange}
                      valid={validation.firstName.valid}
                      validationMessage={validation.firstName.validationMessage}
                    />
                    <AuthInput
                      id="lastName"
                      name="lastName"
                      type="text"
                      label="Last name"
                      autoComplete="family-name"
                      value={values.lastName}
                      onChange={handleChange}
                      valid={validation.lastName.valid}
                      validationMessage={validation.lastName.validationMessage}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <AuthInput
                      id="middleName"
                      name="middleName"
                      type="text"
                      label="Middle name"
                      placeholder="Optional"
                      autoComplete="additional-name"
                      value={values.middleName}
                      onChange={handleChange}
                      valid={validation.middleName.valid}
                      validationMessage={
                        validation.middleName.validationMessage
                      }
                    />
                    <AuthInput
                      id="suffix"
                      name="suffix"
                      type="text"
                      label="Suffix"
                      placeholder="Jr., III, etc."
                      value={values.suffix}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-linen/40">
                    About you{" "}
                    <span className="normal-case text-linen/30">
                      (optional)
                    </span>
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <AuthInput
                      id="birthDate"
                      name="birthDate"
                      type="date"
                      label="Birth date"
                      value={values.birthDate}
                      onChange={handleChange}
                    />
                    <AuthInput
                      id="gender"
                      name="gender"
                      type="text"
                      label="Gender"
                      value={values.gender}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-linen/40">
                    Contact &amp; address{" "}
                    <span className="normal-case text-linen/30">
                      (optional)
                    </span>
                  </p>
                  <AuthInput
                    id="phone"
                    name="phone"
                    type="tel"
                    label="Phone"
                    autoComplete="tel"
                    value={values.phone}
                    onChange={handleChange}
                  />
                  <AuthInput
                    id="address"
                    name="address"
                    type="text"
                    label="Address"
                    autoComplete="street-address"
                    value={values.address}
                    onChange={handleChange}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <AuthInput
                      id="city"
                      name="city"
                      type="text"
                      label="City"
                      autoComplete="address-level2"
                      value={values.city}
                      onChange={handleChange}
                    />
                    <AuthInput
                      id="state"
                      name="state"
                      type="text"
                      label="State / Province"
                      autoComplete="address-level1"
                      value={values.state}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <AuthInput
                      id="country"
                      name="country"
                      type="text"
                      label="Country"
                      autoComplete="country-name"
                      value={values.country}
                      onChange={handleChange}
                    />
                    <AuthInput
                      id="postalCode"
                      name="postalCode"
                      type="text"
                      label="Postal code"
                      autoComplete="postal-code"
                      value={values.postalCode}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </motion.div>
              <input type="hidden" name="password" value={values.password} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.fieldset>

      <FormMessage message={formState.message} success={formState.success} />

      <div className="flex items-center justify-between gap-3">
        {stepIndex > 0 ? (
          <button
            type="button"
            onClick={handleBack}
            disabled={isBusy}
            className="text-sm font-medium text-linen/60 transition-colors hover:text-linen disabled:opacity-50"
          >
            Back
          </button>
        ) : (
          <span />
        )}
        {isLastStep ? (
          <AuthButton
            type="submit"
            loading={isBusy}
            loadingText="Setting up…"
            className="w-auto px-6"
          >
            Complete setup
          </AuthButton>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className="rounded-md bg-clay px-6 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-clay/90"
          >
            Continue
          </button>
        )}
      </div>
    </form>
  );
}
