import { Permission, TPermission } from "./organisationRole";
import { can, getUserRole } from "./permission";

export class OrganisationPolicy {
  private async check(
    userId: string,
    organisationId: string,
    permission: TPermission,
  ): Promise<boolean> {
    const role = await getUserRole(userId, organisationId);
    if (role === null) return false;
    return can(role, permission);
  }

  // ── Organisation ──────────────────────────────────────────────
  viewOrganisation(u: string, o: string) {
    return this.check(u, o, Permission["organisation.view"]);
  }
  manageOrganisation(u: string, o: string) {
    return this.check(u, o, Permission["organisation.manage"]);
  }
  deleteOrganisation(u: string, o: string) {
    return this.check(u, o, Permission["organisation.delete"]);
  }
  transferOwnership(u: string, o: string) {
    return this.check(u, o, Permission["organisation.transfer_ownership"]);
  }

  // ── Billing & Subscription ────────────────────────────────────
  viewBilling(u: string, o: string) {
    return this.check(u, o, Permission["billing.view"]);
  }
  manageBilling(u: string, o: string) {
    return this.check(u, o, Permission["billing.manage"]);
  }
  manageSubscription(u: string, o: string) {
    return this.check(u, o, Permission["subscription.manage"]);
  }

  // ── Staff & Roles ─────────────────────────────────────────────
  viewStaff(u: string, o: string) {
    return this.check(u, o, Permission["staff.view"]);
  }
  manageStaff(u: string, o: string) {
    return this.check(u, o, Permission["staff.manage"]);
  }
  manageRoles(u: string, o: string) {
    return this.check(u, o, Permission["roles.manage"]);
  }

  // ── Events ───────────────────────────────────────────────────
  viewEvents(u: string, o: string) {
    return this.check(u, o, Permission["events.view"]);
  }
  createEvent(u: string, o: string) {
    return this.check(u, o, Permission["events.create"]);
  }
  editEvent(u: string, o: string) {
    return this.check(u, o, Permission["events.edit"]);
  }
  deleteEvent(u: string, o: string) {
    return this.check(u, o, Permission["events.delete"]);
  }
  publishEvent(u: string, o: string) {
    return this.check(u, o, Permission["events.publish"]);
  }
  manageEventDays(u: string, o: string) {
    return this.check(u, o, Permission["event_days.manage"]);
  }
  manageSessions(u: string, o: string) {
    return this.check(u, o, Permission["sessions.manage"]);
  }

  // ── Tickets ──────────────────────────────────────────────────
  viewTickets(u: string, o: string) {
    return this.check(u, o, Permission["tickets.view"]);
  }
  manageTickets(u: string, o: string) {
    return this.check(u, o, Permission["tickets.manage"]);
  }
  refundTicket(u: string, o: string) {
    return this.check(u, o, Permission["tickets.refund"]);
  }
  cancelTicket(u: string, o: string) {
    return this.check(u, o, Permission["tickets.cancel"]);
  }
  resendTicket(u: string, o: string) {
    return this.check(u, o, Permission["tickets.resend"]);
  }

  // ── Attendees ────────────────────────────────────────────────
  viewAttendees(u: string, o: string) {
    return this.check(u, o, Permission["attendees.view"]);
  }
  exportAttendees(u: string, o: string) {
    return this.check(u, o, Permission["attendees.export"]);
  }

  // ── Finance ──────────────────────────────────────────────────
  viewFinance(u: string, o: string) {
    return this.check(u, o, Permission["finance.view"]);
  }
  exportFinance(u: string, o: string) {
    return this.check(u, o, Permission["finance.export"]);
  }
  viewPayouts(u: string, o: string) {
    return this.check(u, o, Permission["finance.payouts.view"]);
  }

  // ── Reports ──────────────────────────────────────────────────
  viewReports(u: string, o: string) {
    return this.check(u, o, Permission["reports.view"]);
  }
  exportReports(u: string, o: string) {
    return this.check(u, o, Permission["reports.export"]);
  }

  // ── Other ────────────────────────────────────────────────────
  manageMemberships(u: string, o: string) {
    return this.check(u, o, Permission["memberships.manage"]);
  }
  manageReservations(u: string, o: string) {
    return this.check(u, o, Permission["reservations.manage"]);
  }
  performCheckin(u: string, o: string) {
    return this.check(u, o, Permission["checkin.perform"]);
  }
  useScanner(u: string, o: string) {
    return this.check(u, o, Permission["scanner.use"]);
  }
  manageIntegrations(u: string, o: string) {
    return this.check(u, o, Permission["integrations.manage"]);
  }
  manageApiKeys(u: string, o: string) {
    return this.check(u, o, Permission["api_keys.manage"]);
  }
  manageWebhooks(u: string, o: string) {
    return this.check(u, o, Permission["webhooks.manage"]);
  }
  manageSettings(u: string, o: string) {
    return this.check(u, o, Permission["settings.manage"]);
  }
  manageBranding(u: string, o: string) {
    return this.check(u, o, Permission["branding.manage"]);
  }

  // ── Discounts ────────────────────────────────────────────────
  viewDiscounts(u: string, o: string) { return this.check(u, o, Permission["discounts.view"]); }
  manageDiscounts(u: string, o: string) { return this.check(u, o, Permission["discounts.manage"]); }
  createDiscount(u: string, o: string) { return this.manageDiscounts(u, o); }
  editDiscount(u: string, o: string) { return this.manageDiscounts(u, o); }
  deleteDiscount(u: string, o: string) { return this.manageDiscounts(u, o); }

  // ── Backward-compatible aliases ───────────────────────────────
  addMember(u: string, o: string) {
    return this.manageStaff(u, o);
  }
  removeMember(u: string, o: string) {
    return this.manageStaff(u, o);
  }
  updateMember(u: string, o: string) {
    return this.manageRoles(u, o);
  }
  updateOrganisationInformations(u: string, o: string) {
    return this.manageOrganisation(u, o);
  }
  updateEventInformations(u: string, o: string) {
    return this.editEvent(u, o);
  }
  checking(u: string, o: string) {
    return this.performCheckin(u, o);
  }
  CreateWithdrawalRequest(u: string, o: string) {
    return this.viewPayouts(u, o);
  }
  manageTeam(u: string, o: string) {
    return this.manageStaff(u, o);
  }
  viewAnalytics(u: string, o: string) {
    return this.viewReports(u, o);
  }
  viewEvent(u: string, o: string) {
    return this.viewEvents(u, o);
  }
  updateFinance(u: string, o: string) {
    return this.exportFinance(u, o);
  }
}

export const organisationPolicy = new OrganisationPolicy();
