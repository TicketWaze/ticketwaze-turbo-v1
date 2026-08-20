/**
 * Uploading an online event's optional document.
 *
 * Three steps, and the middle one does NOT go through Ticketwaze:
 *
 *   1. ask the API for a presigned PUT
 *   2. PUT the bytes straight to S3 from the browser
 *   3. tell the API the upload finished, so it can verify and record it
 *
 * Step 2 bypasses the API deliberately. `config/bodyparser.ts` caps multipart
 * at 10MB and Next server actions do the same, so a 50MB handout could not pass
 * through either — and raising those limits would buffer every large upload
 * through Node for no benefit.
 *
 * Run AFTER the event is saved: the S3 key is scoped to the event id.
 */

export type EventDocumentUploadResult =
  | { status: "success" }
  | { status: "skipped" }
  | { status: "failed"; message: string };

const API = process.env.NEXT_PUBLIC_API_URL;

export async function uploadEventDocument({
  organisationId,
  eventId,
  accessToken,
  file,
  locale,
}: {
  organisationId: string;
  eventId: string;
  accessToken: string;
  file: File | null;
  locale: string;
}): Promise<EventDocumentUploadResult> {
  if (!file) return { status: "skipped" };

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Accept-Language": locale,
  };

  try {
    const urlRequest = await fetch(
      `${API}/events/${organisationId}/${eventId}/document/upload-url`,
      {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          size: file.size,
          // Browsers leave this empty for types they do not recognise, and the
          // signature has to be minted against whatever we then PUT with.
          contentType: file.type || "application/octet-stream",
        }),
      },
    );
    const urlResponse = await urlRequest.json();
    if (urlResponse.status !== "success") {
      return {
        status: "failed",
        message: urlResponse.message ?? "The document could not be uploaded.",
      };
    }

    const { uploadUrl, key, contentType } = urlResponse.data;

    // Exactly the content type the URL was signed with, or S3 rejects the
    // signature. Not file.type again — the API may have substituted a default.
    const put = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: file,
    });
    if (!put.ok) {
      return {
        status: "failed",
        message: "The document could not be uploaded.",
      };
    }

    const completeRequest = await fetch(
      `${API}/events/${organisationId}/${eventId}/document/complete`,
      {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ key, filename: file.name }),
      },
    );
    const completeResponse = await completeRequest.json();
    if (completeResponse.status !== "success") {
      return {
        status: "failed",
        message:
          completeResponse.message ?? "The document could not be uploaded.",
      };
    }

    return { status: "success" };
  } catch {
    return { status: "failed", message: "The document could not be uploaded." };
  }
}

/** Removes the stored document. Used by the edit form. */
export async function deleteEventDocument({
  organisationId,
  eventId,
  accessToken,
  locale,
}: {
  organisationId: string;
  eventId: string;
  accessToken: string;
  locale: string;
}): Promise<EventDocumentUploadResult> {
  try {
    const request = await fetch(
      `${API}/events/${organisationId}/${eventId}/document`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
        },
      },
    );
    const response = await request.json();
    if (response.status !== "success") {
      return {
        status: "failed",
        message: response.message ?? "The document could not be removed.",
      };
    }
    return { status: "success" };
  } catch {
    return { status: "failed", message: "The document could not be removed." };
  }
}
