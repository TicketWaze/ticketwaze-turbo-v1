import createPowerIota from "./createPowerIota";

export const Role = {
  Staff: 1,
  FinanceManager: 2,
  EventManager: 3,
  Admin: 4,
  Owner: 5,
} as const;

export type TRole = (typeof Role)[keyof typeof Role];

const iota = createPowerIota();

export const Permission = {
  "organisation.view": iota(),
  "organisation.manage": iota(),
  "organisation.delete": iota(),
  "organisation.transfer_ownership": iota(),
  "billing.view": iota(),
  "billing.manage": iota(),
  "subscription.manage": iota(),
  "staff.view": iota(),
  "staff.manage": iota(),
  "roles.manage": iota(),
  "events.view": iota(),
  "events.create": iota(),
  "events.edit": iota(),
  "events.delete": iota(),
  "events.publish": iota(),
  "event_days.manage": iota(),
  "sessions.manage": iota(),
  "tickets.view": iota(),
  "tickets.manage": iota(),
  "tickets.refund": iota(),
  "tickets.cancel": iota(),
  "tickets.resend": iota(),
  "attendees.view": iota(),
  "attendees.export": iota(),
  "finance.view": iota(),
  "finance.export": iota(),
  "finance.payouts.view": iota(),
  "reports.view": iota(),
  "reports.export": iota(),
  "memberships.manage": iota(),
  "reservations.manage": iota(),
  "checkin.perform": iota(),
  "scanner.use": iota(),
  "integrations.manage": iota(),
  "api_keys.manage": iota(),
  "webhooks.manage": iota(),
  "settings.manage": iota(),
  "branding.manage": iota(),
  // Restaurant module. APPEND ONLY, and keep in the same order as the API's
  // app/roles/organisation_roles.ts — these are bit positions, so any divergence
  // between the two files silently re-maps every permission.
  "restaurants.view": iota(),
  "restaurants.create": iota(),
  "restaurants.edit": iota(),
  "restaurants.delete": iota(),
  "menu.manage": iota(),
  "pos.charge": iota(),
  "pos.refund": iota(),
} as const;

export type TPermission = (typeof Permission)[keyof typeof Permission];

// Backward-compatible alias used by permission.ts
export const UserActions = Permission;
export type UserAction = TPermission;

const P = Permission;

const StaffPermission =
  P["events.view"] |
  P["tickets.view"] |
  P["attendees.view"] |
  P["checkin.perform"] |
  P["scanner.use"] |
  // A restaurant cashier is Staff, so taking counter payments is a default.
  // Refunding is not — pos.refund stays with finance/admin.
  P["restaurants.view"] |
  P["pos.charge"];

const FinanceManagerPermission =
  P["billing.view"] |
  P["finance.view"] |
  P["finance.export"] |
  P["finance.payouts.view"] |
  P["reports.view"] |
  P["reports.export"] |
  P["tickets.view"] |
  P["tickets.refund"] |
  P["tickets.cancel"] |
  P["attendees.view"] |
  P["restaurants.view"] |
  P["pos.refund"];

const EventManagerPermission =
  P["staff.view"] |
  P["events.view"] |
  P["events.create"] |
  P["events.edit"] |
  P["events.publish"] |
  P["event_days.manage"] |
  P["sessions.manage"] |
  P["tickets.view"] |
  P["tickets.manage"] |
  P["attendees.view"] |
  P["attendees.export"] |
  P["reports.view"] |
  P["reservations.manage"] |
  P["checkin.perform"] |
  P["scanner.use"] |
  // The activity-manager role: runs restaurants day to day, but cannot delete
  // one or move money back out.
  P["restaurants.view"] |
  P["restaurants.create"] |
  P["restaurants.edit"] |
  P["menu.manage"] |
  P["pos.charge"];

const AdminPermission =
  P["organisation.view"] |
  P["staff.view"] |
  P["staff.manage"] |
  // roles.manage is intentionally Owner-only (mirrors the API): only the Owner
  // may assign roles or edit member permissions.
  P["events.view"] |
  P["events.create"] |
  P["events.edit"] |
  P["events.delete"] |
  P["events.publish"] |
  P["event_days.manage"] |
  P["sessions.manage"] |
  P["tickets.view"] |
  P["tickets.manage"] |
  P["tickets.refund"] |
  P["tickets.cancel"] |
  P["tickets.resend"] |
  P["attendees.view"] |
  P["attendees.export"] |
  P["finance.view"] |
  P["finance.export"] |
  P["reports.view"] |
  P["reports.export"] |
  P["memberships.manage"] |
  P["reservations.manage"] |
  P["checkin.perform"] |
  P["scanner.use"] |
  P["integrations.manage"] |
  P["settings.manage"] |
  P["branding.manage"] |
  P["restaurants.view"] |
  P["restaurants.create"] |
  P["restaurants.edit"] |
  P["restaurants.delete"] |
  P["menu.manage"] |
  P["pos.charge"] |
  P["pos.refund"];

const OwnerPermission =
  P["organisation.view"] |
  P["organisation.manage"] |
  P["organisation.delete"] |
  P["organisation.transfer_ownership"] |
  P["billing.view"] |
  P["billing.manage"] |
  P["subscription.manage"] |
  P["staff.view"] |
  P["staff.manage"] |
  P["roles.manage"] |
  P["events.view"] |
  P["events.create"] |
  P["events.edit"] |
  P["events.delete"] |
  P["events.publish"] |
  P["event_days.manage"] |
  P["sessions.manage"] |
  P["tickets.view"] |
  P["tickets.manage"] |
  P["tickets.refund"] |
  P["tickets.cancel"] |
  P["tickets.resend"] |
  P["attendees.view"] |
  P["attendees.export"] |
  P["finance.view"] |
  P["finance.export"] |
  P["finance.payouts.view"] |
  P["reports.view"] |
  P["reports.export"] |
  P["memberships.manage"] |
  P["reservations.manage"] |
  P["checkin.perform"] |
  P["scanner.use"] |
  P["integrations.manage"] |
  P["api_keys.manage"] |
  P["webhooks.manage"] |
  P["settings.manage"] |
  P["branding.manage"] |
  P["restaurants.view"] |
  P["restaurants.create"] |
  P["restaurants.edit"] |
  P["restaurants.delete"] |
  P["menu.manage"] |
  P["pos.charge"] |
  P["pos.refund"];

export const OrganisationPermissions: Record<TRole, bigint> = {
  [Role.Owner]: OwnerPermission,
  [Role.Admin]: AdminPermission,
  [Role.EventManager]: EventManagerPermission,
  [Role.FinanceManager]: FinanceManagerPermission,
  [Role.Staff]: StaffPermission,
};
