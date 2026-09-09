import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ServerResponse } from 'http';
import { Observable, tap } from 'rxjs';

@Injectable()
export class CookieCheckInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse<ServerResponse>();

    return next.handle().pipe(
      tap(() => {
        // Type assertion to tell TypeScript what type we expect
        const headers = response.getHeaders() as Record<
          string,
          string | string[] | undefined
        >;
        const cookieHeader = headers['set-cookie'];

        if (cookieHeader) {
          this.logCookies(cookieHeader);
        } else {
          console.log('⚠️ No cookies were set');
        }
      }),
    );
  }

  private logCookies(cookieHeader: string | string[]): void {
    if (typeof cookieHeader === 'string') {
      console.log('🍪 Cookie set:', cookieHeader.split(';')[0]);
    } else {
      console.log(`🍪 ${cookieHeader.length} cookie(s) set:`);
      cookieHeader.forEach((cookie, index) => {
        console.log(`  ${index + 1}: ${cookie.split(';')[0]}`);
      });
    }
  }
}
