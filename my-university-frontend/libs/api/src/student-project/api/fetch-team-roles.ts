import type { TeamRoleDto } from '@api/services/student-projects-api-service';
import { studentProjectsApiService } from '@api/services';

export type GetTeamRolesParams = {
  signal?: AbortSignal;
};

export function fetchTeamRoles(params?: GetTeamRolesParams): Promise<ReadonlyArray<TeamRoleDto>> {
  return studentProjectsApiService.getTeamRoles(params?.signal);
}

