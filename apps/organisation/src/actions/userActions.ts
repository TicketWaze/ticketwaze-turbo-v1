"use server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

/**
 * The access token, read from the session at call time.
 *
 * These actions used to be handed the token the browser was holding, captured
 * by `useSession()` when the page mounted. An access token lives fifteen
 * minutes; a screen someone stays and works in outlives that, and the stale
 * token came back from the API as 401 "Unauthorized access". Reading it here
 * means every call carries a token that auth() has just refreshed if needed.
 */
async function sessionToken(): Promise<string> {
  const session = await auth();
  return session?.user.accessToken ?? "";
}

export async function UpdateUserProfile(
  firstName: string,
  lastName: string,
  locale: string,
) {
  try {
    const accessToken = await sessionToken();
    const request = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Accept-Language": locale,
        origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
      },
      body: JSON.stringify({
        firstName,
        lastName,
      }),
    });
    const response = await request.json();
    if (response.status === "failed") {
      throw new Error(response.message);
    }
  } catch (error: any) {
    return {
      error: error?.message ?? "An unknown error occurred",
    };
  }
  revalidatePath("/settings/account");
}

export async function UpdateUserProfileImage(
  body: FormData,
) {
  try {
    const accessToken = await sessionToken();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/upload-image`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: body,
      },
    );

    const data = await res.json();
    if (data.status === "success") {
      revalidatePath("/settings/account");
      return {
        status: "success",
        message: "Image Uploaded",
      };
    } else {
      return {
        status: "failed",
        message: data.message,
      };
    }
  } catch (err: any) {
    return {
      error: err?.message ?? "An unknown error occurred",
    };
  }
}

export async function UpdateUserPreferences(
  body: unknown,
  locale: string,
) {
  try {
    const accessToken = await sessionToken();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/me/preferences`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
        body: JSON.stringify(body),
      },
    );

    const data = await res.json();

    if (data.status === "success") {
      revalidatePath("/preferences");
      return {
        status: "success",
      };
    } else {
      return {
        status: "failed",
        message: data.message,
      };
    }
  } catch (err: any) {
    return {
      error: err?.message ?? "An unknown error occurred",
    };
  }
}
