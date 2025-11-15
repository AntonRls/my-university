import type {
  ParticipantDto,
  ApproveParticipantParams,
} from '@api/services/student-projects-api-service';
import { studentProjectsApiService } from '@api/services';

export function approveParticipant(params: ApproveParticipantParams): Promise<ParticipantDto> {
  return studentProjectsApiService.approveParticipant(params);
}

