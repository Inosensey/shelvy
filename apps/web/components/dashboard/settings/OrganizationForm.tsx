"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Field, inputClass } from "@/components/reusable/ui/FormField";
import { AuthButton } from "@/components/auth/AuthButton";
import { FormMessage } from "@/components/reusable/FormMessage";
import { saveOrganization } from "@/actions/settingsAction";

const initialState: ApiResponse<null> = {
  success: false,
  message: "",
  data: null,
};

export function OrganizationForm({
  organization,
  canEdit,
}: {
  organization: MyOrganization;
  canEdit: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    saveOrganization,
    initialState,
  );

  useEffect(() => {
    if (state.success) toast.success(state.message);
  }, [state]);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-5">
      <fieldset
        disabled={pending || !canEdit}
        className="m-0 flex flex-col gap-4 border-0 p-0"
      >
        <Field label="Organization name">
          <input
            name="name"
            defaultValue={organization.name}
            className={inputClass}
          />
        </Field>
        <Field label="Description (optional)">
          <textarea
            name="description"
            rows={3}
            defaultValue={organization.description ?? ""}
            className={inputClass}
          />
        </Field>
      </fieldset>

      {!canEdit && (
        <p className="text-sm text-linen/50">
          Only the owner can edit the organization.
        </p>
      )}
      {!state.success && state.message && (
        <FormMessage message={state.message} success={false} />
      )}

      {canEdit && (
        <div>
          <AuthButton
            type="submit"
            loading={pending}
            loadingText="Saving…"
            className="w-auto px-6"
          >
            Save changes
          </AuthButton>
        </div>
      )}
    </form>
  );
}
