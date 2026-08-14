"use server";

import { revalidatePath } from "next/cache";

/**
 * Approve or reject a digital product.
 *
 * Approval is the ONLY route to `live` — there is no automatic publish and no
 * working malware scanner behind it, so this action is the moment a stranger's
 * file becomes something buyers can pay for. The reviewing admin is expected to
 * have downloaded and opened it first.
 */
export async function UpdateSaleStatusAction(
  saleId: string,
  status: "approved" | "rejected",
  accessToken: string,
  locale: string,
  rejectionReason?: string,
) {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/sale/${saleId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ADMIN_URL!,
        },
        body: JSON.stringify({
          status,
          ...(status === "rejected" && rejectionReason
            ? { rejectionReason }
            : {}),
        }),
      },
    );
    const data = await request.json();
    if (data.status === "success") {
      revalidatePath(`/activities/sale/${saleId}`);
      revalidatePath(`/activities`);
      return { status: "success" };
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

/**
 * Mint a short-lived link so the admin can read the file they are ruling on.
 *
 * The URL is returned rather than the bytes: the file can be a gigabyte, and
 * routing it through a server action would buffer all of it through Node for no
 * reason. It expires in about fifteen minutes, so it is fetched at the moment
 * of the click and never stored in the page.
 */
export async function InspectSaleFileAction(
  saleId: string,
  saleFileId: string,
  accessToken: string,
  locale: string,
) {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/sale/${saleId}/file/${saleFileId}/inspect`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ADMIN_URL!,
        },
        cache: "no-store",
      },
    );
    const data = await request.json();
    if (data.status === "success") {
      return { status: "success", url: data.url as string };
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
