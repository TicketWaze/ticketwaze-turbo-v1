import {
  CompleteSaleUpload,
  GetSaleUploadUrl,
} from "@/actions/SaleActions";

/**
 * PUTs a file straight to S3 with a presigned URL.
 *
 * `fetch` is deliberately not used: it cannot report upload progress, and a
 * 250MB product on a Haitian connection with no progress bar is
 * indistinguishable from a frozen page. XHR is the only browser API that
 * exposes `upload.onprogress`.
 *
 * The Content-Type header must match the one the URL was signed with, or S3
 * rejects the PUT with a signature mismatch.
 */
export function putToS3(
  url: string,
  file: File,
  contentType: string,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    xhr.setRequestHeader("Content-Type", contentType);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        // S3 answers with an XML error body that means nothing to a seller.
        reject(new Error(`Upload failed (${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.onabort = () => reject(new Error("Upload cancelled"));
    xhr.send(file);
  });
}

export type UploadResult =
  | { status: "success" }
  | { status: "failed"; message: string; upgradeRequired?: boolean };

/**
 * The whole upload: ask for a URL, PUT the bytes, tell the API it landed.
 *
 * Shared by the create wizard and the replace-file panel so both enforce the
 * same order. Step 3 is not optional — until it runs the object is an orphan
 * with no row pointing at it, and the sale still has nothing to sell.
 */
export async function uploadSaleFile({
  organisationId,
  saleId,
  accessToken,
  locale,
  file,
  onProgress,
}: {
  organisationId: string;
  saleId: string;
  accessToken: string;
  locale: string;
  file: File;
  onProgress: (percent: number) => void;
}): Promise<UploadResult> {
  const contentType = file.type || "application/octet-stream";

  const signed = await GetSaleUploadUrl(
    organisationId,
    saleId,
    locale,
    { filename: file.name, size: file.size, contentType },
  );
  if (signed.status !== "success") {
    return {
      status: "failed",
      message: signed.error ?? "Upload failed",
      upgradeRequired: signed.upgradeRequired,
    };
  }

  try {
    await putToS3(signed.uploadUrl, file, signed.contentType, onProgress);
  } catch (error) {
    return {
      status: "failed",
      message: error instanceof Error ? error.message : "Upload failed",
    };
  }

  const completed = await CompleteSaleUpload(
    organisationId,
    saleId,
    locale,
    { key: signed.key, filename: file.name },
  );
  if (completed.status !== "success") {
    return {
      status: "failed",
      message: completed.error ?? "Upload failed",
      upgradeRequired: completed.upgradeRequired,
    };
  }

  return { status: "success" };
}
