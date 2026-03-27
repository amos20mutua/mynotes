import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const legacyRoutes = ["/auth", "/deliveries", "/discover", "/messages", "/operator", "/products", "/seller", "/sellers"];

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const matchedRoute = legacyRoutes.find((route) => pathname.startsWith(route));

  if (!matchedRoute) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/";
  url.searchParams.set("from", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/auth/:path*", "/deliveries/:path*", "/discover/:path*", "/messages/:path*", "/operator/:path*", "/products/:path*", "/seller/:path*", "/sellers/:path*"]
};
