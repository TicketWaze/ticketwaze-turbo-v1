import type { KycStatus } from "@ticketwaze/typescript-config";

// Organisation KYC on the client: the document matrix (mirrors the API's
// services/organisation_kyc.ts) and the three-step upload to the private
// bucket (presigned PUT, same as event documents).

export type KycOrganisationType = "individual" | "business" | "ngo" | "public";
export type KycIdDocumentType = "passport" | "id_card" | "drivers_licence";
export type KycFileKind =
  | "id_front"
  | "id_back"
  | "selfie"
  | "business_registration"
  | "tax_id"
  | "authority_proof"
  | "ngo_registration"
  | "statutes"
  | "board_letter"
  | "official_letter";

export const KYC_ORGANISATION_TYPES: KycOrganisationType[] = [
  "individual",
  "business",
  "ngo",
  "public",
];
export const KYC_ID_DOCUMENT_TYPES: KycIdDocumentType[] = [
  "passport",
  "id_card",
  "drivers_licence",
];

export const KYC_MAX_FILE_BYTES = 10 * 1024 * 1024;
export const KYC_PHOTO_ACCEPT = "image/jpeg,image/png,image/webp,image/heic";
export const KYC_DOCUMENT_ACCEPT = `${KYC_PHOTO_ACCEPT},application/pdf`;

export function identityKinds(idType: KycIdDocumentType): KycFileKind[] {
  return idType === "passport"
    ? ["id_front", "selfie"]
    : ["id_front", "id_back", "selfie"];
}

/** Organisation papers by legal type: required, then optional. */
export function organisationKinds(type: KycOrganisationType): {
  required: KycFileKind[];
  optional: KycFileKind[];
} {
  switch (type) {
    case "business":
      return {
        required: ["business_registration", "tax_id"],
        optional: ["authority_proof"],
      };
    case "ngo":
      return {
        required: ["ngo_registration", "statutes", "board_letter"],
        optional: [],
      };
    case "public":
      return { required: ["official_letter"], optional: [] };
    default:
      return { required: [], optional: [] };
  }
}

export function isPhotoKind(kind: KycFileKind) {
  return kind === "id_front" || kind === "id_back" || kind === "selfie";
}

export interface KycState {
  status: KycStatus;
  organisationType: KycOrganisationType | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
}

function headers(accessToken: string, locale: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Accept-Language": locale,
    Origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
  };
}

export async function fetchKycStatus(
  organisationId: string,
  accessToken: string,
  locale: string,
): Promise<KycState | null> {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/organisations/${organisationId}/kyc`,
      { headers: headers(accessToken, locale), cache: "no-store" },
    );
    const response = await request.json();
    return response.status === "success" ? response.kyc : null;
  } catch {
    return null;
  }
}

export type KycUploadResult =
  | { ok: true; key: string }
  | { ok: false; code?: string; message?: string };

/** Uploads one document straight to the private bucket; returns its key. */
export async function uploadKycFile({
  organisationId,
  accessToken,
  locale,
  kind,
  file,
}: {
  organisationId: string;
  accessToken: string;
  locale: string;
  kind: KycFileKind;
  file: File;
}): Promise<KycUploadResult> {
  try {
    const urlRequest = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/organisations/${organisationId}/kyc/upload-url`,
      {
        method: "POST",
        headers: {
          ...headers(accessToken, locale),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          kind,
          filename: file.name,
          size: file.size,
          contentType: file.type || "application/octet-stream",
        }),
      },
    );
    const urlResponse = await urlRequest.json();
    if (urlResponse.status !== "success") {
      return { ok: false, code: urlResponse.code, message: urlResponse.message };
    }
    const { uploadUrl, key, contentType } = urlResponse.data;
    // Exactly the content type the URL was signed with, or S3 refuses it.
    const put = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: file,
    });
    return put.ok ? { ok: true, key } : { ok: false };
  } catch {
    return { ok: false };
  }
}

export async function submitKyc({
  organisationId,
  accessToken,
  locale,
  organisationType,
  idDocumentType,
  files,
}: {
  organisationId: string;
  accessToken: string;
  locale: string;
  organisationType: KycOrganisationType;
  idDocumentType: KycIdDocumentType;
  files: { kind: KycFileKind; key: string; filename: string }[];
}): Promise<{ ok: boolean; code?: string }> {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/organisations/${organisationId}/kyc`,
      {
        method: "POST",
        headers: {
          ...headers(accessToken, locale),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ organisationType, idDocumentType, files }),
      },
    );
    const response = await request.json();
    return { ok: response.status === "success", code: response.code };
  } catch {
    return { ok: false };
  }
}
