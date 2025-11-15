import type {
  StudentProjectDto,
  UpdateStudentProjectParams,
} from '@api/services/student-projects-api-service';
import { studentProjectsApiService } from '@api/services';

export function updateStudentProject(
  params: UpdateStudentProjectParams,
): Promise<StudentProjectDto> {
  return studentProjectsApiService.updateProject(params);
}

