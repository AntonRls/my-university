export { maxBridgeService } from './max-bridge-service';
export { userService } from './user-service';
export { authService } from './auth-service';
export { booksApiService } from './books-api-service';
export { reservationsApiService } from './reservations-api-service';
export { eventsApiService } from './events-api-service';
export { usersApiService } from './users-api-service';
export { universitiesApiService } from './universities-api-service';
export { studentProjectsApiService } from './student-projects-api-service';
export { scheduleApiService } from './schedule-api-service';
export type { SimpleUserDto } from './users-api-service';
export type {
  UserUniversity,
  UserUniversityDto,
  UserUniversityApproveStatus,
} from './users-api-service';
export type { University, UniversityDto } from './universities-api-service';
export type {
  SkillDto,
  TeamRoleDto,
  ParticipantDto,
  StudentProjectDto,
  CreateStudentProjectParams,
  UpdateStudentProjectParams,
  CreateParticipantRequestParams,
  ApproveParticipantParams,
  RejectParticipantParams,
  UpdateParticipantRoleParams,
  CreateTeamRoleParams,
} from './student-projects-api-service';
export type { FetchMyScheduleParams } from './schedule-api-service';

