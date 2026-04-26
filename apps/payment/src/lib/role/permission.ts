import { OrganisationPermissions, TRole, UserAction } from "./organisationRole";

export function can(role: TRole, action: UserAction): boolean {
  return (OrganisationPermissions[role] & action) === action;
}

export async function getUserRole(
  userId: string,
  organisationId: string,
): Promise<TRole> {
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/organisations/${organisationId}/role/${userId}`,
  );
  const membership = await request.json();

  if (membership.status === "failed") {
    throw new Error("User is not a member of this organisation");
  }

  return membership.role as TRole;
}
