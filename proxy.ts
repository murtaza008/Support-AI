import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/assistants/:path*",
    "/knowledge/:path*",
    "/conversations/:path*",
    "/analytics/:path*",
    "/team/:path*",
    "/settings/:path*",
    "/billing/:path*",
    "/onboarding",
  ],
};
