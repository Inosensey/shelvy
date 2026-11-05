import FormValidation from "./validation";

export const registerValidationRules = {
  email: (value: string) => FormValidation({ stateName: "email", value }),
  password: (value: string) =>
    FormValidation({ stateName: "password", value }),
};

export const loginValidationRules = {
  email: (value: string) => FormValidation({ stateName: "email", value }),
  loginPassword: (value: string) =>
    FormValidation({ stateName: "loginPassword", value }),
};

export const supplierFormValidationRules = {
  name: (value: string) => FormValidation({ stateName: "name", value }),
  email: (value: string) => FormValidation({ stateName: "email", value }),
};
