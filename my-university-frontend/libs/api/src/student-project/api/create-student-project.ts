import type {
  StudentProjectDto,
  CreateStudentProjectParams,
} from '@api/services/student-projects-api-service';
import { studentProjectsApiService } from '@api/services';

export function createStudentProject(
  params: CreateStudentProjectParams,
): Promise<StudentProjectDto> {
  return studentProjectsApiService.createProject(params);
}

