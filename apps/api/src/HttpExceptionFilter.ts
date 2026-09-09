import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status = exception.getStatus();
    const res = exception.getResponse();

    let message: string;

    if (typeof res === 'string') {
      message = res;
    } else if (typeof res === 'object' && res !== null && 'message' in res) {
      message = (res as { message: string }).message;
    } else {
      message = 'Unknown error';
    }

    response.status(status).json({
      success: false,
      message,
      data: { error: res },
    });
  }
}
