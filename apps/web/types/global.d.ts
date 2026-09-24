interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface UserInformation {
  userId?: string;
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  birthDate?: string;
  gender?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

interface Organization {
  name: string,
  description?: string,
}

interface OnboardingInfo {
  userInfo: UserInformation,
  organization: Organization
}

interface User {
  id: string,
  email: string,
  createdAt: string,
  updatedAt: string,
}
