import { NextResponse } from "next/server";
import { verifyJWT } from "./lib/auth";
import corsHeaders from "./lib/cors";
import {
  X_HEADER_USER_EMAIL,
  X_HEADER_USER_ID,
  X_HEADER_USER_NAME,
} from "./lib/constant";

export function proxy(request) {
  // CORS preflight requests never carry cookies (per the Fetch/CORS spec),
  // so checking auth here would always fail and break every cross-origin
  // POST/PUT/DELETE to a protected route. Let OPTIONS pass through so the
  // route's own OPTIONS handler can answer the preflight; the real request
  // that follows is still fully checked below.
  if (request.method === "OPTIONS") {
    return NextResponse.next();
  }

  const user = verifyJWT(request);

  if (!user) {
    return NextResponse.json(
      {
        message: "Unauthorized Request",
      },
      {
        status: 401,
        headers: corsHeaders,
      }
    );
  }


  const requestHeaders = new Headers(request.headers);

  requestHeaders.set(X_HEADER_USER_ID, user.id);
  requestHeaders.set(X_HEADER_USER_EMAIL, user.email);
  requestHeaders.set(X_HEADER_USER_NAME, user.username);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// All requests to /api/item/* and /api/user/* (and now /api/audit/*) must
// carry a valid session cookie, or the proxy responds 401 before the route
// handler ever runs.
export const config = {
  matcher: ["/api/item/:path*", "/api/user/:path*", "/api/audit/:path*"],
};