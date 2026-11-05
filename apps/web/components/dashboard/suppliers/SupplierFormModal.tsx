"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/reusable/ui/Modal";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthButton } from "@/components/auth/AuthButton";
import { FormMessage } from "@/components/reusable/FormMessage";
import { saveSupplier } from "@/actions/supplierActions";
import type { formValidation } from "@/utils/validation.types";
import { supplierFormValidationRules } from "@/utils/validationRules";
import { checkValidations, validateGroupInput } from "@/utils/validation";

const initialState: ApiResponse<null> = {
  success: false,
  message: "",
  data: null,
};

const initialValidation: formValidation = {
  name: { validationName: "name", valid: true, validationMessage: "" },
  email: { validationName: "email", valid: true, validationMessage: "" },
};

interface SupplierFormModalProps {
  supplier: Supplier | null;
  onClose: () => void;
}

export function SupplierFormModal({
  supplier,
  onClose,
}: SupplierFormModalProps) {
  const [state, formAction, isPending] = useActionState(
    saveSupplier,
    initialState,
  );
  const [values, setValues] = useState({
    name: supplier?.name ?? "",
    email: supplier?.email ?? "",
    phone: supplier?.phone ?? "",
    address: supplier?.address ?? "",
  });
  const [validation, setValidation] =
    useState<formValidation>(initialValidation);

  useEffect(() => {
    if (state.success) {
      toast.success(state.message);
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));

    const rule =
      supplierFormValidationRules[
        name as keyof typeof supplierFormValidationRules
      ];
    if (rule) {
      setValidation((prev) => ({ ...prev, [name]: rule(value) }));
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const results = validateGroupInput(values, supplierFormValidationRules);
    const isValid = checkValidations(results, setValidation);
    if (!isValid) {
      e.preventDefault();
    }
  }

  return (
    <Modal
      onClose={onClose}
      locked={isPending}
      labelledBy="supplier-form-title"
    >
      <h2 id="supplier-form-title" className="font-display text-lg text-linen">
        {supplier ? "Edit supplier" : "Add supplier"}
      </h2>

      <form
        action={formAction}
        onSubmit={handleSubmit}
        noValidate
        className="mt-5 flex flex-col gap-4"
      >
        {supplier && <input type="hidden" name="id" value={supplier.id} />}

        <fieldset
          disabled={isPending}
          className="m-0 flex flex-col gap-4 border-0 p-0"
        >
          <AuthInput
            id="name"
            name="name"
            type="text"
            label="Name"
            value={values.name}
            onChange={handleChange}
            valid={!validation.name}
            validationMessage={validation.name.validationMessage ?? ""}
          />
          <AuthInput
            id="email"
            name="email"
            type="email"
            label="Email (optional)"
            value={values.email}
            onChange={handleChange}
            valid={!validation.email}
            validationMessage={validation.email.validationMessage ?? ""}
          />
          <AuthInput
            id="phone"
            name="phone"
            type="tel"
            label="Phone (optional)"
            value={values.phone}
            onChange={handleChange}
          />
          <AuthInput
            id="address"
            name="address"
            type="text"
            label="Address (optional)"
            value={values.address}
            onChange={handleChange}
          />
        </fieldset>

        {!state.success && (
          <FormMessage message={state.message} success={false} />
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-md px-4 py-2 text-sm font-medium text-linen/60 hover:text-linen disabled:opacity-50"
          >
            Cancel
          </button>
          <AuthButton
            type="submit"
            loading={isPending}
            loadingText="Saving…"
            className="w-auto px-6"
          >
            {supplier ? "Save changes" : "Add supplier"}
          </AuthButton>
        </div>
      </form>
    </Modal>
  );
}
