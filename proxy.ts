import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { isPublicAssetPath, isPublicAuthPath } from "./lib/chat/routes";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/ping")) {
    return new Response("pong", { status: 200 });
  }

  if (isPublicAssetPath(pathname)) {
    return NextResponse.next();
  }

  if (isPublicAuthPath(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: request.nextUrl.protocol === "https:",
  });

  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  if (!token) {
    const redirectUrl = encodeURIComponent(
      `${request.nextUrl.pathname}${request.nextUrl.search}`
    );

    return NextResponse.redirect(
      new URL(`${base}/api/auth/guest?redirectUrl=${redirectUrl}`, request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/chat/:id",
    "/api/:path*",
    "/login",
    "/register",

    "/((?!_next/static|_next/image|images/|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
