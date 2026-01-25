import createPowerIota from "./createPowerIota";

export const Role = {
  CheckIn: 1,
  EventManager: 2,
  Finance: 3,
  Staff: 4,
  Admin: 5,
} as const;

export type TRole = (typeof Role)[keyof typeof Role];

const iota = createPowerIota();

export const UserActions = {
  "event:create": iota(),
  "event:view": iota(),
  "event:delete": iota(),
  "event:update": iota(),
  "event:check-in": iota(),

  "finance:update": iota(),
  "finance:view": iota(),

  "team:add": iota(),
  "team:update": iota(),
  "team:delete": iota(),

  "settings:update": iota(),
  "analytics:view": iota(),
  "organisation:update": iota(),
  "organisation:delete": iota(),
} as const;

export type UserAction = (typeof UserActions)[keyof typeof UserActions];

const CheckInPermission =
  UserActions["event:check-in"] | UserActions["event:view"];

const EventManagerPermission =
  CheckInPermission |
  UserActions["event:create"] |
  UserActions["event:update"] |
  UserActions["event:delete"];

const FinancePermission =
  UserActions["finance:update"] | UserActions["finance:view"];

const StaffPermission =
  UserActions["team:add"] |
  UserActions["analytics:view"] |
  UserActions["team:update"] |
  UserActions["finance:view"];

const AdminPermission =
  CheckInPermission |
  EventManagerPermission |
  FinancePermission |
  StaffPermission |
  UserActions["organisation:delete"] |
  UserActions["team:delete"] |
  UserActions["organisation:update"];

export const OrganisationPermissions: Record<TRole, number> = {
  [Role.Admin]: AdminPermission,
  [Role.Staff]: StaffPermission,
  [Role.Finance]: FinancePermission,
  [Role.EventManager]: EventManagerPermission,
  [Role.CheckIn]: CheckInPermission,
};
