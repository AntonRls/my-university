import type {
  StudentProjectDto,
} from '@api/services/student-projects-api-service';
import { studentProjectsApiService } from '@api/services';

export type GetStudentProjectsParams = {
  signal?: AbortSignal;
};

export function fetchStudentProjects(
  params?: GetStudentProjectsParams,
): Promise<ReadonlyArray<StudentProjectDto>> {
  return studentProjectsApiService.getProjects(params?.signal);
}

