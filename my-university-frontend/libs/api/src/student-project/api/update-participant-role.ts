import type {
  ParticipantDto,
  UpdateParticipantRoleParams,
} from '@api/services/student-projects-api-service';
import { studentProjectsApiService } from '@api/services';

export function updateParticipantRole(params: UpdateParticipantRoleParams): Promise<ParticipantDto> {
  return studentProjectsApiService.updateParticipantRole(params);
}

