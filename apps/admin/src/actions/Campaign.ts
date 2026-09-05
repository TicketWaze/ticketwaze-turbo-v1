"use server";

import { revalidatePath } from "next/cache";

/**
 * Operations > Emails.
 *
 * Every call here is a thin proxy to the API with the admin's bearer token
 * attached. The rules — who is excluded, how the body is sanitised, how the
 * batches are paced — all live server-side; nothing in this file decides
 * anything, and it should stay that way. A rule enforced in a server action is
 * a rule that only applies to requests that came through this app.
 */

const API = () => process.env.NEXT_PUBLIC_API_URL;

interface AuthArgs {
  accessToken: string;
  locale: string;
}

type ActionResult<T> = ({ status: "success" } & T) | { error: string };

async function call<T>(
  path: string,
  init: RequestInit,
  { accessToken, locale }: AuthArgs,
): Promise<ActionResult<T>> {
  try {
    const request = await fetch(`${API()}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Accept-Language": locale,
        origin: process.env.NEXT_PUBLIC_ADMIN_URL!,
        ...(init.headers ?? {}),
      },
    });

    const data = await request.json();
    if (data.status === "success") return data;

    /**
     * The API's validation failures come back as `errors`, not `message`. Left
     * unhandled they surface as "undefined", which tells the admin nothing
     * about which field it objected to.
     */
    if (data.errors) {
      const first = Array.isArray(data.errors) ? data.errors[0] : null;
      throw new Error(first?.message ?? "Validation failed");
    }
    throw new Error(data.message ?? "Something went wrong");
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

const json = (body: unknown): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export interface CampaignDraft {
  name: string;
  subjectFr: string;
  subjectEn?: string | null;
  bodyFr: string;
  bodyEn?: string | null;
  toAllUsers: boolean;
  toAllOrganisations: boolean;
  manualEmails: string;
}

export async function CreateCampaignAction(
  body: CampaignDraft,
  auth: AuthArgs,
) {
  const result = await call<{
    campaign: { emailCampaignId: string };
    invalidEmails: string[];
  }>("/admin/campaigns", json(body), auth);
  if ("status" in result) revalidatePath("/emails");
  return result;
}

export async function UpdateCampaignAction(
  campaignId: string,
  body: Partial<CampaignDraft>,
  auth: AuthArgs,
) {
  const result = await call<{
    campaign: { emailCampaignId: string };
    invalidEmails: string[];
  }>(
    `/admin/campaigns/${campaignId}`,
    { ...json(body), method: "PUT" },
    auth,
  );
  if ("status" in result) revalidatePath("/emails");
  return result;
}

export async function DeleteCampaignAction(
  campaignId: string,
  auth: AuthArgs,
) {
  const result = await call<Record<string, never>>(
    `/admin/campaigns/${campaignId}`,
    { method: "DELETE" },
    auth,
  );
  if ("status" in result) revalidatePath("/emails");
  return result;
}

/** Step two's live counter. Called on every change to the selection, so it is not cached. */
export async function PreviewAudienceAction(
  body: {
    toAllUsers: boolean;
    toAllOrganisations: boolean;
    manualEmails: string;
  },
  auth: AuthArgs,
) {
  return call<{
    breakdown: {
      users: number;
      organisations: number;
      manual: number;
      duplicates: number;
      optedOut: number;
      total: number;
    };
    invalidEmails: string[];
  }>("/admin/campaigns/audience", json(body), auth);
}

/** Step three. Returns the real rendered email, from the same code that sends it. */
export async function PreviewCampaignAction(
  body: {
    subjectFr: string;
    subjectEn?: string;
    bodyFr: string;
    bodyEn?: string;
    locale?: "fr" | "en";
  },
  auth: AuthArgs,
) {
  return call<{ subject: string; html: string; locale: string }>(
    "/admin/campaigns/preview",
    json(body),
    auth,
  );
}

export async function SendTestCampaignAction(
  campaignId: string,
  body: { email?: string; locale?: "fr" | "en" },
  auth: AuthArgs,
) {
  return call<Record<string, never>>(
    `/admin/campaigns/${campaignId}/test`,
    json(body),
    auth,
  );
}

export async function SendCampaignAction(campaignId: string, auth: AuthArgs) {
  const result = await call<{ totalRecipients: number }>(
    `/admin/campaigns/${campaignId}/send`,
    json({}),
    auth,
  );
  if ("status" in result) {
    revalidatePath("/emails");
    revalidatePath(`/emails/${campaignId}`);
  }
  return result;
}

export async function CancelCampaignAction(
  campaignId: string,
  auth: AuthArgs,
) {
  const result = await call<Record<string, never>>(
    `/admin/campaigns/${campaignId}/cancel`,
    json({}),
    auth,
  );
  if ("status" in result) {
    revalidatePath("/emails");
    revalidatePath(`/emails/${campaignId}`);
  }
  return result;
}

/**
 * Uploads an image for the body.
 *
 * Takes a `FormData` straight from the client and forwards it untouched — no
 * `Content-Type` header is set, because the boundary token is part of that
 * header and only `fetch` knows it. Setting it by hand is the classic way to
 * make a multipart upload arrive as an empty body.
 */
export async function UploadCampaignImageAction(
  formData: FormData,
  auth: AuthArgs,
) {
  return call<{ url: string; key: string }>(
    "/admin/campaigns/image",
    { method: "POST", body: formData },
    auth,
  );
}

/** Polled by the campaign detail page while a send is running. */
export async function FetchCampaignAction(
  campaignId: string,
  auth: AuthArgs,
) {
  return call<{
    campaign: Record<string, unknown>;
    progress: {
      pending: number;
      sent: number;
      failed: number;
      skipped: number;
    };
    failures: { email: string; error: string; source: string }[];
  }>(`/admin/campaigns/${campaignId}`, { method: "GET" }, auth);
}
