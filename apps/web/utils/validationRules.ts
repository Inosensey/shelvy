import FormValidation from "./validation";

export const registerValidationRules = {
  email: (value: string) => FormValidation({ stateName: "email", value }),
  password: (value: string) =>
    FormValidation({ stateName: "password", value }),
};

export const loginValidationRules = {
  email: (value: string) => FormValidation({ stateName: "email", value }),
  password: (value: string) =>
    FormValidation({ stateName: "password", value }),
};
