// proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { nestJsEndpoints } from "./lib/nestJsEndpoints";

const protectedRoutes = ["/dashboard", "/onboarding"];
const authRoutes = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/session/validate`,
        {
          headers: {
            Cookie: `token=${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok || !data.data) {
        const response = NextResponse.redirect(new URL("/login", request.url));
        response.cookies.delete("token");
        return response;
      }

      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-user-id", data.userId);
      requestHeaders.set("x-user-type", data.userType);

      const userHaveTakenOnboarding = (
        await nestJsEndpoints.userApi.getMeInfo()
      ).data;

      if (!userHaveTakenOnboarding && !pathname.startsWith("/onboarding")) {
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }

      if (userHaveTakenOnboarding && pathname.startsWith("/onboarding")) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      console.error("Session validation error:", error);
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (isAuthRoute && token) {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/session/validate`,
        {
          headers: {
            Cookie: `token=${token}`,
          },
        },
      );

      const data = await response.json();

      if (response.ok && data.data) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    } catch {
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
