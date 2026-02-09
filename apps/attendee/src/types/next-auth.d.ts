import { User } from "@ticketwaze/typescript-config";
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: User;
  }

  interface JWT {
    user: User;
  }
}
