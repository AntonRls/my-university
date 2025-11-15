export type {
  Skill,
  TeamRole,
  Participant,
  StudentProject,
  StudentProjectEvent,
} from '@api/student-project';

export {
  mapStudentProjectDto,
  mapStudentProjectList,
  mapSkillDto,
  mapTeamRoleDto,
  mapParticipantDto,
} from './lib/map';

export { ProjectCard } from './ui/ProjectCard';

export {
  fetchStudentProjects,
  fetchSkills,
  fetchTeamRoles,
  createTeamRole,
  createStudentProject,
  updateStudentProject,
  createParticipantRequest,
  approveParticipant,
  rejectParticipant,
  updateParticipantRole,
  removeParticipant,
} from '@api/student-project';
export type {
  GetStudentProjectsParams,
  GetSkillsParams,
  GetTeamRolesParams,
  RemoveParticipantParams,
} from '@api/student-project';

