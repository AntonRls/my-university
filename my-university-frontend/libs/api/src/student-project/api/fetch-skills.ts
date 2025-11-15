import type { SkillDto } from '@api/services/student-projects-api-service';
import { studentProjectsApiService } from '@api/services';

export type GetSkillsParams = {
  signal?: AbortSignal;
};

export function fetchSkills(params?: GetSkillsParams): Promise<ReadonlyArray<SkillDto>> {
  return studentProjectsApiService.getSkills(params?.signal);
}

