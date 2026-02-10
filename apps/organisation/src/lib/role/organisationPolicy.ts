import { UserActions } from "./organisationRole";
import { can, getUserRole } from "./permission";

export class OrganisationPolicy {
  async manageTeam(userId: string, organisationId: string): Promise<boolean> {
    const role = await getUserRole(userId, organisationId);
    return can(role, UserActions["team:manage"]);
  }

  async updateOrganisationInformations(
    userId: string,
    organisationId: string,
  ): Promise<boolean> {
    const role = await getUserRole(userId, organisationId);
    return can(role, UserActions["organisation:update"]);
  }

  async updateEventInformations(
    userId: string,
    organisationId: string,
  ): Promise<boolean> {
    const role = await getUserRole(userId, organisationId);
    return can(role, UserActions["event:update"]);
  }

  async viewAnalytics(
    userId: string,
    organisationId: string,
  ): Promise<boolean> {
    const role = await getUserRole(userId, organisationId);
    return can(role, UserActions["analytics:view"]);
  }

  async viewFinance(userId: string, organisationId: string): Promise<boolean> {
    const role = await getUserRole(userId, organisationId);
    return can(role, UserActions["finance:view"]);
  }

  async createEvent(userId: string, organisationId: string): Promise<boolean> {
    const role = await getUserRole(userId, organisationId);
    return can(role, UserActions["event:create"]);
  }
  async viewEvent(userId: string, organisationId: string): Promise<boolean> {
    const role = await getUserRole(userId, organisationId);
    return can(role, UserActions["event:view"]);
  }
}

export const organisationPolicy = new OrganisationPolicy();
