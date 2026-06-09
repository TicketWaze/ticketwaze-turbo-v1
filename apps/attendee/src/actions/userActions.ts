"use server";
import { revalidatePath } from "next/cache";

export async function UpdateUserPreferences(
  accessToken: string,
  body: unknown,
  locale: string,
) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/me/preferences`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ATTENDEE_URL!,
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
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : "An unknown error occurred",
    };
  }
}

export async function UpdateUserProfileImage(
  accessToken: string,
  body: FormData,
  locale: string,
) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/upload-image`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ATTENDEE_URL!,
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
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : "An unknown error occurred",
    };
  }
}

export async function UpdateUserProfile(
  accessToken: string,
  body: unknown,
  locale: string,
) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Accept-Language": locale,
        Origin: process.env.NEXT_PUBLIC_ATTENDEE_URL!,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (data.status === "success") {
      revalidatePath("/profile");
      return {
        status: "success",
      };
    } else {
      return {
        status: "failed",
        message: data.message,
      };
    }
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : "An unknown error occurred",
    };
  }
}

export async function FollowOrganisationAction(
  accessToken: string,
  organisationId: string,
  pathname: string,
  locale: string,
) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/organisations/${organisationId}/follow`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ATTENDEE_URL!,
        },
      },
    );
    const data = await res.json();

    if (data.status === "success") {
      revalidatePath(pathname);
      return {
        status: "success",
      };
    } else {
      return {
        status: "failed",
        message: data.message,
      };
    }
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : "An unknown error occurred",
    };
  }
}

export type DeletionOrg = { organisationId: string; organisationName: string };

export async function RequestAccountDeletion(
  accessToken: string,
  body: { reason: string; notes?: string },
  locale: string,
) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/me/request-deletion`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ATTENDEE_URL!,
        },
        body: JSON.stringify(body),
      },
    );
    const data = await res.json();
    if (data.status === "success") {
      return {
        status: "success" as const,
        scheduledAt: data.scheduledAt as string,
        soloOrgsWillLoseAccess: (data.soloOrgsWillLoseAccess ?? []) as DeletionOrg[],
      };
    }
    if (data.status === "ownership_transfer_required") {
      return {
        status: "ownership_transfer_required" as const,
        orgsNeedingTransfer: (data.orgsNeedingTransfer ?? []) as DeletionOrg[],
        soloOrgs: (data.soloOrgs ?? []) as DeletionOrg[],
      };
    }
    return { status: "failed" as const, message: data.message as string };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "An unknown error occurred" };
  }
}

export async function CancelAccountDeletion(
  accessToken: string,
  locale: string,
) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/me/request-deletion`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ATTENDEE_URL!,
        },
      },
    );
    const data = await res.json();
    if (data.status === "success") {
      return { status: "success" as const };
    }
    return { status: "failed" as const, message: data.message as string };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "An unknown error occurred" };
  }
}

export async function UnfollowOrganisationAction(
  accessToken: string,
  organisationId: string,
  pathname: string,
  locale: string,
) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/organisations/${organisationId}/follow`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ATTENDEE_URL!,
        },
      },
    );
    const data = await res.json();

    if (data.status === "success") {
      revalidatePath(pathname);
      return {
        status: "success",
      };
    } else {
      return {
        status: "failed",
        message: data.message,
      };
    }
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : "An unknown error occurred",
    };
  }
}
