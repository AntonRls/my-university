import type {
  ParticipantDto,
  CreateParticipantRequestParams,
} from '@api/services/student-projects-api-service';
import { studentProjectsApiService } from '@api/services';

export function createParticipantRequest(
  params: CreateParticipantRequestParams,
): Promise<ParticipantDto> {
  return studentProjectsApiService.createParticipantRequest(params);
}

