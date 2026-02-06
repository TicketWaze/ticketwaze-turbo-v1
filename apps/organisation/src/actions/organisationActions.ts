"use server";
import { revalidatePath } from "next/cache";

export async function UpdateOrganisationProfile(
  organisationId: string,
  organisationName: string,
  organisationDescription: string,
  accessToken: string,
  locale: string,
) {
  try {
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
  accessToken: string,
  body: FormData,
  locale: string,
) {
  try {
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

export async function UpdateOrganisationPaymentInformation(
  organisationId: string,
  bankName: string,
  bankAccountName: string,
  bankAccountNumber: string,
  accessToken: string,
  locale: string,
) {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/organisations/${organisationId}/payment-informations`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
        body: JSON.stringify({
          bankName,
          bankAccountName,
          bankAccountNumber,
        }),
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
  accessToken: string,
  locale: string,
) {
  try {
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
  accessToken: string,
  locale: string,
) {
  try {
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

export async function EditMemberAction(
  organisationId: string,
  userId: string,
  accessToken: string,
  role: string,
  locale: string,
) {
  try {
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
  accessToken: string,
  email: string,
  locale: string,
) {
  try {
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
  accessToken: string,
  email: string,
  locale: string,
) {
  try {
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

export async function UpdateOrganisationCurrency(
  organisationId: string,
  accessToken: string,
  body: unknown,
  locale: string,
) {
  try {
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
  accessToken: string,
  body: unknown,
  locale: string,
) {
  try {
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
  accessToken: string,
  locale: string,
) {
  try {
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
  accessToken: string,
  locale: string,
  changePinToken: string,
  body: unknown,
) {
  try {
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
  accessToken: string,
  locale: string,
) {
  try {
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
export async function BankWithdrawalRequest(
  organisationId: string,
  accessToken: string,
  locale: string,
  body: unknown,
) {
  try {
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
