import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Role } from "@/generated/prisma/client";

const { auth } = NextAuth(authConfig);

// Role-based access map: which roles can access which path prefixes
const roleAccess: Record<string, Role[]> = {
  "/admin": ["ADMIN"],
  "/kanban": ["ADMIN", "RECEPTIONIST"],
  "/patients": ["ADMIN", "RECEPTIONIST", "DENTIST"],
  "/day": ["ADMIN", "RECEPTIONIST", "DENTIST"],
  "/dashboard": ["ADMIN", "RECEPTIONIST", "DENTIST"],
  "/portal": ["PATIENT"],
};

export default auth((req: NextRequest & { auth: { user?: { role?: string } } | null }) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = session.user.role as Role;

  for (const [prefix, allowedRoles] of Object.entries(roleAccess)) {
    if (pathname.startsWith(prefix)) {
      if (!allowedRoles.includes(role)) {
        const fallback = role === "PATIENT" ? "/portal" : "/dashboard";
        return NextResponse.redirect(new URL(fallback, req.url));
      }
      break;
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login|register).*)"],
};
