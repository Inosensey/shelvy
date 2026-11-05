"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Field, inputClass } from "@/components/reusable/ui/FormField";
import { AuthButton } from "@/components/auth/AuthButton";
import { FormMessage } from "@/components/reusable/FormMessage";
import { saveProfile } from "@/actions/settingsAction";

const initialState: ApiResponse<null> = {
  success: false,
  message: "",
  data: null,
};

export function ProfileForm({
  info,
  email,
  role,
}: {
  info: UserInfo | null;
  email: string;
  role: string;
}) {
  const [state, formAction, pending] = useActionState(
    saveProfile,
    initialState,
  );

  useEffect(() => {
    if (state.success) toast.success(state.message);
  }, [state]);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-5">
      <fieldset
        disabled={pending}
        className="m-0 grid gap-4 border-0 p-0 sm:grid-cols-2"
      >
        <Field label="First name">
          <input
            name="firstName"
            defaultValue={info?.firstName}
            className={inputClass}
          />
        </Field>
        <Field label="Last name">
          <input
            name="lastName"
            defaultValue={info?.lastName}
            className={inputClass}
          />
        </Field>
        <Field label="Middle name (optional)">
          <input
            name="middleName"
            defaultValue={info?.middleName ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Suffix (optional)">
          <input
            name="suffix"
            defaultValue={info?.suffix ?? ""}
            placeholder="Jr., III…"
            className={inputClass}
          />
        </Field>
        <Field label="Phone (optional)">
          <input
            name="phone"
            type="tel"
            defaultValue={info?.phone ?? ""}
            className={inputClass}
          />
        </Field>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email" hint="Email can't be changed here.">
          <input value={email} readOnly disabled className={inputClass} />
        </Field>
        <Field label="Role">
          <input
            value={role[0] + role.slice(1).toLowerCase()}
            readOnly
            disabled
            className={inputClass}
          />
        </Field>
      </div>

      {!state.success && state.message && (
        <FormMessage message={state.message} success={false} />
      )}

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
    </form>
  );
}
