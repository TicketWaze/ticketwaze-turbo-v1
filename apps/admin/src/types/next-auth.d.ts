import NextAuth from "next-auth";

export interface AdminUser {
  accessToken: string;
  adminId: string;
  email: string;
  role: number;
  roleLabel: string;
  customPermissions: string[] | null;
  effectivePermissionKeys: string[];
  id: string;
  accessTokenExpires?: number;
}

declare module "next-auth" {
  interface Session {
    user: AdminUser;
  }
}
