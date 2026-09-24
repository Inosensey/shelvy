import type { validation, formValidation } from "./validation.types";

type params = {
  value: string;
  stateName: string;
  confirmPassword?: string;
  currentEmail?: string;
  /** Reference value for cross-field checks, e.g. the password a
   *  "confirmPassword" field needs to match. */
  matchValue?: string;
};

export const validateGroupInput = (
  values: Record<string, string>,
  validationRules: Record<string, (value: string) => validation>,
): formValidation => {
  const results: formValidation = {};
  for (const [key, value] of Object.entries(values)) {
    const validationResult = validationRules[key](value);
    results[key] = {
      validationName: key,
      valid: validationResult.valid,
      validationMessage: validationResult.validationMessage,
    };
  }
  return results;
};

export const checkValidations = (
  validationInfo: formValidation | validation,
  setValidation?: React.Dispatch<React.SetStateAction<formValidation>>,
) => {
  let isValid = true;
  for (const [key, value] of Object.entries(validationInfo)) {
    if (setValidation) {
      setValidation((prev) => ({
        ...prev,
        [key]: {
          validationName: key,
          valid: value.valid,
          validationMessage: value.validationMessage,
        },
      }));
    }
    if (value.valid === false) {
      isValid = false;
    }
  }

  return isValid;
};

const FormValidation = (data: params): validation => {
  switch (data.stateName) {
    case "name":
    case "firstName":
    case "middleName":
    case "lastName":
    case "suffix":
    case "organizationName":
      return validateName(data);
    case "username":
      return validateUsername(data);
    case "identifier":
      // login's combined username-or-email field -- required only, since
      // it could be either format
      return validateUsername(data);
    // case "birthDay":
    // case "birthMonth":
    // case "birthYear":
    //   return validateDate(data);
    // case "weight":
    // case "height":
    //   return validateNumber(data);
    //   case "date":
    //   case "timeStart":
    //   case "timeEnd":
    //     return validateTimeOrDate(data);
    // case "gender":
    // case "country":
    // case "state":
    // case "city":
    //   return validateString(data);
    case "email":
      return validateEmail(data);
    case "password":
      return validatePassword(data);
    case "confirmPassword":
      return validateConfirmPassword(data);
    default:
      return {
        validationName: "",
        valid: false,
        validationMessage: "State name is undefined",
      };
  }
};

// let validation: validation = {
//   validationName: "",
//   valid: false,
//   validationMessage: "",
// };

const validateDate = (data: params): validation => {
  const numberRegex = /^\d*$/;

  if (data.stateName === "birthDay") {
    if (
      data.value.length === 0 ||
      data.value === "0" ||
      !numberRegex.test(data.value)
    ) {
      return {
        validationName: data.stateName,
        valid: false,
        validationMessage:
          "Please enter the day of your birth date by entering a number between 1 and 31.",
      };
    }
  }
  if (data.stateName === "birthMonth") {
    if (data.value.length === 0) {
      return {
        validationName: data.stateName,
        valid: false,
        validationMessage: "Select your birth month.",
      };
    }
  }
  if (data.stateName === "birthYear") {
    if (
      data.value.length === 0 ||
      data.value === "0" ||
      !numberRegex.test(data.value)
    ) {
      return {
        validationName: data.stateName,
        valid: false,
        validationMessage: "Please enter a birth year from 1900 onwards.",
      };
    }
  }

  return {
    validationName: data.stateName,
    valid: true,
    validationMessage: "",
  };
};

const validateNumber = (data: params): validation => {
  const numberRegex = /^\d*\.?\d+$/;
  if (data.value.length === 0) {
    return {
      validationName: data.stateName,
      valid: false,
      validationMessage: `${
        data.stateName.charAt(0).toUpperCase() + data.stateName.slice(1)
      } field is required`,
    };
  }
  if (!numberRegex.test(data.value)) {
    return {
      validationName: data.stateName,
      valid: false,
      validationMessage: `Invalid format (${
        data.stateName.charAt(0).toUpperCase() + data.stateName.slice(1)
      }:  Contains a character)`,
    };
  }
  return {
    validationName: data.stateName,
    valid: true,
    validationMessage: "",
  };
};

const validateString = (data: params): validation => {
  const numbersRegex = /[0-9]/;
  if (data.value.length === 0) {
    return {
      validationName: data.stateName,
      valid: false,
      validationMessage: "This field is required",
    };
  }
  if (
    data.stateName === "mealName" ||
    data.stateName === "cookingInstruction" ||
    data.stateName === "exerciseName" ||
    data.stateName === "measurement" ||
    data.stateName === "exerciseDemo" ||
    data.stateName === "veganAlternative" ||
    data.stateName === "instruction"
  ) {
    return {
      validationName: data.stateName,
      valid: true,
      validationMessage: "",
    };
  }
  if (!numbersRegex.test(data.value)) {
    return {
      validationName: data.stateName,
      valid: true,
      validationMessage: "",
    };
  }
  return {
    validationName: data.stateName,
    valid: false,
    validationMessage: "Invalid format (contains a number)",
  };
};

const validateName = (data: params): validation => {
  const nameRegex =
    /^(?!.*\d)(?:[A-Za-z\s]+(?:[.,](?![\s]))?)*(?:\s(?:Sr\.|Jr\.))?$/;
  if (data.value.length === 0) {
    return {
      validationName: data.stateName,
      valid: false,
      validationMessage: "This field is required",
    };
  }
  if (nameRegex.test(data.value)) {
    return {
      validationName: data.stateName,
      valid: true,
      validationMessage: "",
    };
  }
  return {
    validationName: data.stateName,
    valid: false,
    validationMessage:
      "Invalid Input. (contains numbers / title before space / Special Characters)",
  };
};

const validateUsername = (data: params): validation => {
  if (data.value.length === 0) {
    return {
      validationName: data.stateName,
      valid: false,
      validationMessage: "This field is required",
    };
  }
  return {
    validationName: data.stateName,
    valid: true,
    validationMessage: "",
  };
};

const validateEmail = (data: params): validation => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(data.value)) {
    return {
      validationName: data.stateName,
      valid: false,
      validationMessage:
        "This email is invalid. Make sure it's written like example@email.com",
    };
  }

  if (data.stateName === "currentEmail") {
    if (data.value !== data.currentEmail) {
      return {
        validationName: data.stateName,
        valid: false,
        validationMessage: "Email is not the same as the Current Email",
      };
    }
  }

  return {
    validationName: data.stateName,
    valid: true,
    validationMessage: "",
  };
};

const validatePassword = (data: params): validation => {
  const minLength = 8;
  const uppercaseRegex = /[A-Z]/;
  const specialCharRegex = /[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/;
  const numberRegex = /\d/;

  if (data.value.length < minLength) {
    return {
      validationName: data.stateName,
      valid: false,
      validationMessage: "Password is too weak. (Minimum of 8 characters)",
    };
  }
  if (!uppercaseRegex.test(data.value)) {
    return {
      validationName: data.stateName,
      valid: false,
      validationMessage: "Password must contain one uppercase letter.",
    };
  }
  if (!specialCharRegex.test(data.value)) {
    return {
      validationName: data.stateName,
      valid: false,
      validationMessage: "Password must contain one special character.",
    };
  }

  if (!numberRegex.test(data.value)) {
    return {
      validationName: data.stateName,
      valid: false,
      validationMessage: "Password must contain at least one number.",
    };
  }

  return {
    validationName: data.stateName,
    valid: true,
    validationMessage: "",
  };
};

const validateConfirmPassword = (data: params): validation => {
  if (data.value.length === 0) {
    return {
      validationName: data.stateName,
      valid: false,
      validationMessage: "Please confirm your password.",
    };
  }
  if (data.value !== data.matchValue) {
    return {
      validationName: data.stateName,
      valid: false,
      validationMessage: "Passwords do not match.",
    };
  }
  return {
    validationName: data.stateName,
    valid: true,
    validationMessage: "",
  };
};

export default FormValidation;
