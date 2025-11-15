import type {
  ParticipantDto,
  RejectParticipantParams,
} from '@api/services/student-projects-api-service';
import { studentProjectsApiService } from '@api/services';

export function rejectParticipant(params: RejectParticipantParams): Promise<ParticipantDto> {
  return studentProjectsApiService.rejectParticipant(params);
}

