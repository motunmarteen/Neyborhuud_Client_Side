import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get("host") || "";

  // 1. Determine which subdomain is being requested
  // We check if it starts with 'app.' (prod/staging) or 'app.localhost' or 'app.neyborhuud.local' (local)
  const isAppDomain =
    hostname.startsWith("app.") ||
    hostname.startsWith("app.localhost") ||
    hostname.startsWith("app.neyborhuud.local");

  if (isAppDomain) {
    // 2. Routing for the PWA app subdomain
    // If they hit the root URL '/', rewrite internally to '/app-root' (which handles auth redirect)
    if (url.pathname === "/") {
      url.pathname = "/app-root";
      return NextResponse.rewrite(url);
    }
  } else {
    // 3. Routing for the landing page subdomain (neyborhuud.com / neyborhuud.local)
    // If they attempt to access PWA routes, redirect them to the app subdomain
    const pwaPaths = [
      "/feed",
      "/chat",
      "/marketplace",
      "/explore",
      "/map",
      "/jobs",
      "/services",
      "/community-emergency",
      "/fyi",
      "/help-request",
      "/incident-reports",
      "/friendship",
      "/settings",
    ];

    const isPwaPath = pwaPaths.some(
      (path) => url.pathname === path || url.pathname.startsWith(path + "/")
    );

    if (isPwaPath) {
      const protocol = request.nextUrl.protocol;
      let targetHost = "app.neyborhuud.com";

      // If we are developing locally, preserve the port and local domain
      if (hostname.includes("localhost") || hostname.includes("local")) {
        targetHost = hostname
          .replace("neyborhuud.local", "app.neyborhuud.local")
          .replace("localhost", "app.localhost");
      }

      return NextResponse.redirect(
        `${protocol}//${targetHost}${url.pathname}${url.search}`
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/ (public assets)
     * - video/ (public assets)
     * - all other common extensions (.png, .jpg, .svg, .json, .webmanifest)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.mp4$|.*\\.svg$|.*\\.json$|manifest\\.webmanifest).*)",
  ],
};
