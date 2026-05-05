'use server'

import { revalidatePath } from "next/cache";

export async function AddAdminAction(
  body: unknown,
  accessToken: string,
  locale: string,
) {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/administrator`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ADMIN_URL!,
        },
        body: JSON.stringify(body),
      },
    );
    const data = await request.json();
    if (data.status === "success") {
      revalidatePath("/admins");
      return {
        status: "success",
      };
    } else {
      throw new Error(data.message);
    }
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}