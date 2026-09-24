// Mirrors the ambient `validation` / `formValidation` types your
// validation.ts already relies on (referenced there without an import,
// so they likely live in a global .d.ts in your real project). Defined
// here just so this template compiles on its own -- delete this file
// and these two exports if you already have the real ones.

export interface validation {
  validationName: string;
  valid: boolean;
  validationMessage: string;
}

export type formValidation = Record<string, validation>;
