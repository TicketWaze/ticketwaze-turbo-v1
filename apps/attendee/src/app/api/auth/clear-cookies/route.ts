// apps/attendee/app/api/auth/clear-cookies/route.ts

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  const response = NextResponse.redirect(new URL("/", process.env.AUTH_URL!));

  // Clear every cookie
  allCookies.forEach((cookie) => {
    response.cookies.set(cookie.name, "", {
      expires: new Date(0),
      path: "/",
    });
  });

  return response;
}
