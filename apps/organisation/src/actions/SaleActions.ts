/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";
import { revalidatePath } from "next/cache";
import { Sale, SaleFile } from "@ticketwaze/typescript-config";

/**
 * Server actions for the sale module.
 *
 * The product file never travels through here. A server action body is capped
 * (and so is the API's multipart parser), which no digital product can be
 * expected to fit inside — so the browser PUTs straight to S3 with a presigned
 * URL these actions only fetch and hand back. Everything else follows the same
 * shape as the raffle and restaurant actions.
 *
 * Unlike those, every result carries a `status` discriminant: the upload is a
 * three-step sequence and each step has to know whether to continue, so
 * "success or an `error` key" is not enough to branch on.
 */

type SaleResult =
  | { status: "success"; sale: Sale }
  | { status: "failed"; error: string };

type DeleteResult =
  | { status: "success"; message: string }
  | { status: "failed"; error: string };

type UploadUrlResult =
  | {
      status: "success";
      uploadUrl: string;
      key: string;
      /** The browser must PUT with exactly this, or the signature will not match. */
      contentType: string;
      expiresInSeconds: number;
    }
  | {
      status: "failed";
      error: string;
      /** Set when the plan is the reason: point at the upgrade page, not an error. */
      upgradeRequired: boolean;
      maxFileMb?: number;
    };

type CompleteResult =
  | { status: "success"; file: SaleFile }
  | {
      status: "failed";
      error: string;
      upgradeRequired: boolean;
      maxFileMb?: number;
    };

const API = () => process.env.NEXT_PUBLIC_API_URL;

function headers(accessToken: string, locale: string, json = false) {
  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    Authorization: `Bearer ${accessToken}`,
    "Accept-Language": locale,
    origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
  };
}

/**
 * The API answers a validation failure with `errors: [{message}]` and no
 * top-level `message`, so without this the seller would be told "undefined".
 */
function messageOf(response: any): string {
  if (typeof response?.message === "string") return response.message;
  if (Array.isArray(response?.errors) && response.errors[0]?.message) {
    return String(response.errors[0].message);
  }
  return "An unknown error occurred";
}

export async function CreateSale(
  organisationId: string,
  accessToken: string,
  body: FormData,
  locale: string,
): Promise<SaleResult> {
  try {
    const request = await fetch(`${API()}/sales/${organisationId}`, {
      method: "POST",
      headers: headers(accessToken, locale),
      body,
    });
    const response = await request.json();
    if (response.status === "success") {
      revalidatePath("/events");
      // The caller needs the id back: uploading the file is a second round trip
      // against the sale that was just created.
      return { status: "success", sale: response.data as Sale };
    }
    return { status: "failed", error: messageOf(response) };
  } catch (error: any) {
    return {
      status: "failed",
      error: error?.message ?? "An unknown error occurred",
    };
  }
}

export async function UpdateSale(
  organisationId: string,
  saleId: string,
  accessToken: string,
  body: FormData,
  locale: string,
): Promise<SaleResult> {
  try {
    const request = await fetch(`${API()}/sales/${organisationId}/${saleId}`, {
      method: "PUT",
      headers: headers(accessToken, locale),
      body,
    });
    const response = await request.json();
    if (response.status === "success") {
      revalidatePath("/events");
      return { status: "success", sale: response.data as Sale };
    }
    return { status: "failed", error: messageOf(response) };
  } catch (error: any) {
    return {
      status: "failed",
      error: error?.message ?? "An unknown error occurred",
    };
  }
}

/**
 * Removes the product, or unlists it when somebody has already bought it.
 *
 * Which of the two happens is the API's decision — buyers keep what they paid
 * for — so the message it returns is what the seller is shown.
 */
export async function DeleteSale(
  organisationId: string,
  saleId: string,
  accessToken: string,
  locale: string,
): Promise<DeleteResult> {
  try {
    const request = await fetch(`${API()}/sales/${organisationId}/${saleId}`, {
      method: "DELETE",
      headers: headers(accessToken, locale, true),
    });
    const response = await request.json();
    if (response.status === "success") {
      revalidatePath("/events");
      return { status: "success", message: String(response.message ?? "") };
    }
    return { status: "failed", error: messageOf(response) };
  } catch (error: any) {
    return {
      status: "failed",
      error: error?.message ?? "An unknown error occurred",
    };
  }
}

/**
 * Step 1 of an upload: somewhere to PUT the file.
 *
 * `size` is a claim. The API checks it against the plan ceiling so an oversized
 * upload is refused before it starts rather than after ten minutes on a slow
 * connection, then re-checks the object S3 actually stored in step 3.
 */
export async function GetSaleUploadUrl(
  organisationId: string,
  saleId: string,
  accessToken: string,
  locale: string,
  file: { filename: string; size: number; contentType: string },
): Promise<UploadUrlResult> {
  try {
    const request = await fetch(
      `${API()}/sales/${organisationId}/${saleId}/files/upload-url`,
      {
        method: "POST",
        headers: headers(accessToken, locale, true),
        body: JSON.stringify(file),
      },
    );
    const response = await request.json();
    if (response.status === "success") {
      return {
        status: "success",
        uploadUrl: response.data.uploadUrl,
        key: response.data.key,
        contentType: response.data.contentType,
        expiresInSeconds: response.data.expiresInSeconds,
      };
    }
    return {
      status: "failed",
      error: messageOf(response),
      upgradeRequired: response.upgradeRequired === true,
      maxFileMb: response.maxFileMb,
    };
  } catch (error: any) {
    return {
      status: "failed",
      error: error?.message ?? "An unknown error occurred",
      upgradeRequired: false,
    };
  }
}

/**
 * Step 3: the browser reports the PUT finished and the API adopts the object.
 *
 * This is what creates the file row, and it sends the sale back to `scanning` —
 * replacing the file always re-triggers review, or an approved listing could
 * have anything swapped in underneath it.
 */
export async function CompleteSaleUpload(
  organisationId: string,
  saleId: string,
  accessToken: string,
  locale: string,
  payload: { key: string; filename: string },
): Promise<CompleteResult> {
  try {
    const request = await fetch(
      `${API()}/sales/${organisationId}/${saleId}/files/complete`,
      {
        method: "POST",
        headers: headers(accessToken, locale, true),
        body: JSON.stringify(payload),
      },
    );
    const response = await request.json();
    if (response.status === "success") {
      revalidatePath("/events");
      return { status: "success", file: response.data.file as SaleFile };
    }
    return {
      status: "failed",
      error: messageOf(response),
      upgradeRequired: response.upgradeRequired === true,
      maxFileMb: response.maxFileMb,
    };
  } catch (error: any) {
    return {
      status: "failed",
      error: error?.message ?? "An unknown error occurred",
      upgradeRequired: false,
    };
  }
}
