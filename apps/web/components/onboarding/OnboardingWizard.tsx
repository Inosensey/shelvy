"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "nextjs-toploader/app";
import { motion, AnimatePresence } from "motion/react";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthButton } from "@/components/auth/AuthButton";
import { FormMessage } from "@/components/reusable/FormMessage";
import { completeOnboarding } from "@/actions/onboardingActions";
import FormValidation, {
  validateGroupInput,
  checkValidations,
} from "@/utils/validation";
import type { formValidation } from "@/utils/validation.types";

type StepId = "personal" | "organization";

const STEPS: { id: StepId; label: string }[] = [
  { id: "personal", label: "Your info" },
  { id: "organization", label: "Organization" },
];

const initialFormState: ApiResponse<OnboardingInfo | null> = {
  success: false,
  message: "",
  data: null,
};

const initialValidation: formValidation = {
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
  organizationName: {
    validationName: "organizationName",
    valid: true,
    validationMessage: "",
  },
};

export function OnboardingWizard() {
  const router = useRouter();

  const [formState, formAction, isPending] = useActionState(
    completeOnboarding,
    initialFormState,
  );

  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState({
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
    organizationName: "",
    organizationDescription: "",
  });
  const [validation, setValidation] =
    useState<formValidation>(initialValidation);

  const currentStep = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
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
    if (currentStep.id === "personal") {
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

    // organization step -- just requires a name
    if (!values.organizationName.trim()) {
      setValidation((prev) => ({
        ...prev,
        organizationName: {
          validationName: "organizationName",
          valid: false,
          validationMessage: "Organization name is required.",
        },
      }));
      return false;
    }
    return true;
  }

  function handleNext() {
    if (!validateCurrentStep()) return;
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }

  function handleBack() {
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  // Enter key (or any submit attempt) on an earlier step advances instead
  // of submitting. Only the last step's submit is allowed through to
  // action={formAction} -- and only once it's valid.
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!isLastStep) {
      e.preventDefault();
      handleNext();
      return;
    }
    if (!validateCurrentStep()) {
      e.preventDefault();
    }
  }

  useEffect(() => {
    if (!formState.message) return;

    if (formState.success) {
      const timer = setTimeout(() => router.push("/dashboard"), 1200);
      return () => clearTimeout(timer);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formState]);

  const loadingText = isPending
    ? "Setting up…"
    : "Redirecting to your dashboard…";
  const isBusy = isPending || formState.success;

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-6"
    >
      {/* Progress indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((step, i) => (
          <div key={step.id} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                i <= stepIndex
                  ? "bg-clay text-ink"
                  : "bg-linen/10 text-linen/40"
              }`}
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
        disabled={isPending}
        animate={{ opacity: isPending ? 0.6 : 1 }}
        transition={{ duration: 0.2 }}
        className="m-0 flex flex-col gap-4 border-0 p-0"
      >
        <AnimatePresence mode="wait">
          {currentStep.id === "personal" ? (
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
                    validationMessage={validation.middleName.validationMessage}
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
                  <span className="normal-case text-linen/30">(optional)</span>
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
                  <span className="normal-case text-linen/30">(optional)</span>
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
          ) : (
            <motion.div
              key="organization"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-4"
            >
              <AuthInput
                id="organizationName"
                name="organizationName"
                type="text"
                label="Organization name"
                value={values.organizationName}
                onChange={handleChange}
                valid={validation.organizationName.valid}
                validationMessage={
                  validation.organizationName.validationMessage
                }
              />

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="organizationDescription"
                  className="text-sm font-medium text-linen"
                >
                  Description <span className="text-linen/40">(optional)</span>
                </label>
                <textarea
                  id="organizationDescription"
                  name="organizationDescription"
                  rows={3}
                  value={values.organizationDescription}
                  onChange={handleChange}
                  className="w-full rounded-md border border-linen/15 bg-ink/40 px-3 py-2 text-[15px]
                             text-linen placeholder:text-linen/35 outline-none transition-colors duration-150
                             focus:border-clay focus:ring-2 focus:ring-clay/30"
                />
              </div>
              <input type="hidden" name="firstName" value={values.firstName} />
              <input
                type="hidden"
                name="middleName"
                value={values.middleName}
              />
              <input type="hidden" name="lastName" value={values.lastName} />
              <input type="hidden" name="suffix" value={values.suffix} />
              <input type="hidden" name="birthDate" value={values.birthDate} />
              <input type="hidden" name="gender" value={values.gender} />
              <input type="hidden" name="phone" value={values.phone} />
              <input type="hidden" name="address" value={values.address} />
              <input type="hidden" name="city" value={values.city} />
              <input type="hidden" name="state" value={values.state} />
              <input type="hidden" name="country" value={values.country} />
              <input
                type="hidden"
                name="postalCode"
                value={values.postalCode}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.fieldset>

      {formState.message && (
        <FormMessage message={formState.message} success={formState.success} />
      )}

      <div className="flex items-center justify-between gap-3">
        {stepIndex > 0 ? (
          <button
            type="button"
            onClick={handleBack}
            disabled={isPending}
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
            loadingText={loadingText}
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
