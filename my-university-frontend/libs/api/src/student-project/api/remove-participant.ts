import { studentProjectsApiService } from '@api/services';

export type RemoveParticipantParams = {
  projectId: string;
  participantId: string;
  signal?: AbortSignal;
};

export function removeParticipant(params: RemoveParticipantParams): Promise<void> {
  return studentProjectsApiService.removeParticipant(params);
}

