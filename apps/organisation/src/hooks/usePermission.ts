import { TPermission, TRole } from "@/lib/role/organisationRole";
import { can } from "@/lib/role/permission";

export function usePermission(role: TRole | null | undefined) {
  return {
    can: (permission: TPermission) => (role ? can(role, permission) : false),
  };
}
