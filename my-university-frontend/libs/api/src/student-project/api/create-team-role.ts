import type { TeamRoleDto, CreateTeamRoleParams } from '@api/services/student-projects-api-service';
import { studentProjectsApiService } from '@api/services';

export function createTeamRole(params: CreateTeamRoleParams): Promise<TeamRoleDto> {
  return studentProjectsApiService.createTeamRole(params);
}

