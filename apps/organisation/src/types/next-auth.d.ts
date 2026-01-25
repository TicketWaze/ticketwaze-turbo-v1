import { Organisation, User } from "@ticketwaze/typescript-config";
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: User;
    activeOrganisation: Organisation;
  }

  interface JWT {
    user: User;
    activeOrganisation: Organisation;
  }
}
