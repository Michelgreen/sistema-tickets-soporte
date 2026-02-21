import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function proxy(request) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  if (!token && (pathname.startsWith("/admin") || pathname.startsWith("/usuario"))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token) {
    try {
      const secret = new TextEncoder().encode("PonganAlvaritoGOD");
      const { payload } = await jwtVerify(token, secret);

      const { rol } = payload;

      if (pathname.startsWith("/admin") && rol !== "ADMIN_TI") {
        return NextResponse.redirect(new URL("/usuario/tickets", request.url));
      }

      if (pathname.startsWith("/usuario") && rol !== "DEPARTAMENTO") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }

      if (pathname === "/login") {
        if (rol === "ADMIN_TI") {
          return NextResponse.redirect(new URL("/admin", request.url));
        } else {
          return NextResponse.redirect(new URL("/usuario/tickets", request.url));
        }
      }

    } catch (error) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/usuario/:path*", "/login"],
};
