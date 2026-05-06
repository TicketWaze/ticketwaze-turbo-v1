import { User } from "@ticketwaze/typescript-config";
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: User & { accessTokenExpires?: number };
  }

  interface JWT {
    user: User;
    accessTokenExpires?: number;
  }
}
