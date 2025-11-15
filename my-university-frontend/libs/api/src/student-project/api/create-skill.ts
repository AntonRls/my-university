import type { SkillDto, CreateSkillParams } from '@api/services/student-projects-api-service';
import { studentProjectsApiService } from '@api/services';

export function createSkill(params: CreateSkillParams): Promise<SkillDto> {
  return studentProjectsApiService.createSkill(params);
}

