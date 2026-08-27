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

export async function UpdateOrganisationProfile(
  organisationId: string,
  organisationName: string,
  organisationDescription: string,
  locale: string,
  organisationWebsite?: string,
  instagram?: string,
  twitter?: string,
) {
  try {
    const accessToken = await sessionToken();
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/organisations/${organisationId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
        body: JSON.stringify({
          organisationName,
          organisationDescription,
          organisationWebsite,
          instagram,
          twitter,
        }),
      },
    );
    const response = await request.json();
    if (response.status === "success") {
      revalidatePath("/settings/profile");
      return {
        status: "success",
        organisation: response.organisation,
      };
    } else {
      throw new Error(response.message);
    }
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

export async function UpdateOrganisationProfileImage(
  organisationId: string,
  body: FormData,
  locale: string,
) {
  try {
    const accessToken = await sessionToken();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/organisations/${organisationId}/upload-image`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
        body: body,
      },
    );

    const data = await res.json();
    if (data.status === "success") {
      revalidatePath("/settings/profile");
      return {
        status: "success",
        message: "Image Uploaded",
        profileImageUrl: data.profileImageUrl,
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

export async function UpdateOrganisationBankPaymentInformation(
  organisationId: string,
  payload: unknown,
  locale: string,
) {
  try {
    const accessToken = await sessionToken();
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/organisations/${organisationId}/payment-informations/bank`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
        body: JSON.stringify(payload),
      },
    );
    const response = await request.json();
    if (response.status === "success") {
      revalidatePath("/settings/payment");
      return {
        status: "success",
      };
    } else {
      throw new Error(response.message);
    }
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

export async function UpdateOrganisationMoncashPaymentInformation(
  organisationId: string,
  payload: unknown,
  locale: string,
) {
  try {
    const accessToken = await sessionToken();
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/organisations/${organisationId}/payment-informations/moncash`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
        body: JSON.stringify(payload),
      },
    );
    const response = await request.json();
    if (response.status === "success") {
      revalidatePath("/settings/payment");
      return {
        status: "success",
      };
    } else {
      throw new Error(response.message);
    }
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

export async function UpdateOrganisationNotificationPreferences(
  organisationId: string,
  body: unknown,
  locale: string,
) {
  try {
    const accessToken = await sessionToken();
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/organisations/${organisationId}/notifications-preferences`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
        body: JSON.stringify(body),
      },
    );
    const response = await request.json();
    if (response.status === "success") {
      revalidatePath("/settings/notification");
      return {
        status: "success",
      };
    } else {
      revalidatePath("/settings/notification");
      throw new Error(response.message);
    }
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

export async function AddMemberAction(
  organisationId: string,
  body: unknown,
  locale: string,
) {
  try {
    const accessToken = await sessionToken();
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/organisations/${organisationId}/invite-user`,
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
    const data = await request.json();
    if (data.status === "success") {
      revalidatePath("/settings/team");
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

export async function UpdateMemberPermissionsAction(
  organisationId: string,
  userId: string,
  permissions: string[],
  locale: string,
) {
  try {
    const accessToken = await sessionToken();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/organisations/${organisationId}/member-permissions/${userId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
        body: JSON.stringify({ permissions }),
      },
    );
    const data = await res.json();
    if (data.status === "success") {
      revalidatePath("/settings/team");
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

export async function EditMemberAction(
  organisationId: string,
  userId: string,
  role: string,
  locale: string,
) {
  try {
    const accessToken = await sessionToken();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/organisations/${organisationId}/update-role/${userId}/${role}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_APP_UR!,
        },
      },
    );
    const data = await res.json();
    if (data.status === "success") {
      revalidatePath("/settings/team");
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

export async function RemoveInvitation(
  organisationId: string,
  email: string,
  locale: string,
) {
  try {
    const accessToken = await sessionToken();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/organisations/${organisationId}/remove-invite/${email}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
      },
    );
    const data = await res.json();

    if (data.status === "success") {
      revalidatePath("/settings/team");
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

export async function RemoveMemberQuery(
  organisationId: string,
  email: string,
  locale: string,
) {
  try {
    const accessToken = await sessionToken();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/organisations/${organisationId}/remove-member/${email}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
      },
    );
    const data = await res.json();
    if (data.status === "success") {
      revalidatePath("/settings/team");
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

export async function TransfertOwnershipQuery(
  organisationId: string,
  email: string,
  locale: string,
) {
  try {
    const accessToken = await sessionToken();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/organisations/${organisationId}/transfert-ownership/${email}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
      },
    );
    const data = await res.json();
    if (data.status === "success") {
      revalidatePath("/settings/team");
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

export async function UpdateOrganisationCurrency(
  organisationId: string,
  body: unknown,
  locale: string,
) {
  try {
    const accessToken = await sessionToken();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/organisations/${organisationId}/currency`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
        body: JSON.stringify(body),
      },
    );
    const data = await res.json();
    if (data.status === "success") {
      revalidatePath("/settings/profile");
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

export async function CreateWithdrawalPin(
  organisationId: string,
  body: unknown,
  locale: string,
) {
  try {
    const accessToken = await sessionToken();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/organisations/${organisationId}/withdrawal-pin`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
        body: JSON.stringify(body),
      },
    );
    const data = await res.json();
    if (data.status === "success") {
      revalidatePath("/settings/payment");
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

export async function ChangeWithdrawalPin(
  organisationId: string,
  locale: string,
) {
  try {
    const accessToken = await sessionToken();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/organisations/${organisationId}/withdrawal-pin`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
      },
    );
    const data = await res.json();
    if (data.status === "success") {
      revalidatePath("/settings/payment");
      return {
        status: "success",
      };
    } else if (data.status === "waiting") {
      revalidatePath("/settings/payment");
      return {
        status: "waiting",
        nextAllowedAt: data.nextAllowedAt,
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

export async function NewWithdrawalPin(
  organisationId: string,
  locale: string,
  changePinToken: string,
  body: unknown,
) {
  try {
    const accessToken = await sessionToken();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/organisations/${organisationId}/withdrawal-pin/${changePinToken}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
        body: JSON.stringify(body),
      },
    );
    const data = await res.json();
    if (data.status === "success") {
      revalidatePath("/settings/payment");
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

export async function DeleteBankingInformations(
  organisationId: string,
  locale: string,
) {
  try {
    const accessToken = await sessionToken();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/organisations/${organisationId}/banking-informations`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
      },
    );
    const data = await res.json();
    if (data.status === "success") {
      revalidatePath("/settings/payment");
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

/*
  ====================FINANCE===================
*/
/**
 * Resolve a Wisetag to the name Wise holds for it.
 *
 * The Verify step of a Wise withdrawal. Nothing is created and no balance
 * moves — this exists so the organiser confirms a name before requesting, which
 * is the only defence against a Wisetag that resolves to a real stranger.
 *
 * The failure `message` is a stable code (`wise_unresolved`, `wise_self`,
 * `wise_invalid_identifier`, `wise_no_name`, `wise_unavailable`,
 * `wise_error`), which the caller turns into copy. Passing the API's English
 * text straight through would break French.
 */
export async function ResolveWiseRecipient(
  organisationId: string,
  locale: string,
  body: { wiseRecipientValue: string },
) {
  try {
    const accessToken = await sessionToken();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/organisations/${organisationId}/transactions/withdrawal/wise/resolve`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
        body: JSON.stringify(body),
      },
    );
    const data = await res.json();
    if (data.status === "success") {
      return { status: "success", name: data.recipient?.name as string };
    }
    return { error: (data.message as string) ?? "wise_error" };
  } catch {
    return { error: "wise_error" };
  }
}

export async function BankWithdrawalRequest(
  organisationId: string,
  locale: string,
  body: unknown,
) {
  try {
    const accessToken = await sessionToken();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/organisations/${organisationId}/transactions/withdrawal`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
        body: JSON.stringify(body),
      },
    );
    const data = await res.json();
    if (data.status === "success") {
      revalidatePath("/settings/finance");
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
