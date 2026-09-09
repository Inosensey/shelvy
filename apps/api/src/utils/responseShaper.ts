export class ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;

  constructor(success: boolean, data: T, message: string) {
    this.success = success;
    this.data = data;
    this.message = message;
  }

  static success<T>(data: T, message = 'Success'): ApiResponse<T> {
    return new ApiResponse(true, data, message);
  }
  static error<T>(data: T, message = 'Error'): ApiResponse<T> {
    return new ApiResponse(false, data, message);
  }
}
