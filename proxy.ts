import { NextResponse, type NextRequest } from "next/server";

/**
 * The admin's front door — an early redirect, not the lock.
 *
 * Anyone without a session cookie is sent to sign in before a page renders.
 * Whether the cookie is genuine is decided by requireAdmin() inside every
 * admin page and server action (lib/admin/auth.ts); this only saves a
 * signed-out visitor a pointless render.
 *
 * Every admin response also gets headers that keep it out of frames, search
 * engines and shared caches.
 */

const COOKIE = "vc_admin"; // lib/admin/auth.ts SESSION_COOKIE

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const signingIn = pathname === "/admin/login";
  // Only page loads are redirected here. A POST is a server action: answering
  // it with a redirect to an HTML page breaks the action protocol, and the
  // action checks the session itself and sends the browser to sign-in properly.
  const pageLoad = request.method === "GET" || request.method === "HEAD";

  let response: NextResponse;
  if (pageLoad && !signingIn && !request.cookies.has(COOKIE)) {
    const url = new URL("/admin/login", request.url);
    if (pathname !== "/admin") url.searchParams.set("next", `${pathname}${search}`);
    response = NextResponse.redirect(url);
  } else {
    response = NextResponse.next();
  }

  response.headers.set("x-frame-options", "DENY");
  response.headers.set("x-robots-tag", "noindex, nofollow");
  response.headers.set("referrer-policy", "same-origin");
  response.headers.set("cache-control", "no-store");
  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
