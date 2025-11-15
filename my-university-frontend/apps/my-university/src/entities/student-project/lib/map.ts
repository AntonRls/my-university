import type {
  StudentProjectDto,
  SkillDto,
  TeamRoleDto,
  ParticipantDto,
  StudentProjectEventDto,
} from '@api/services/student-projects-api-service';
import type { StudentProject, Skill, TeamRole, Participant, StudentProjectEvent } from '@api/student-project';

export function mapSkillDto(dto: SkillDto): Skill {
  return {
    id: dto.id,
    name: dto.name,
  };
}

export function mapTeamRoleDto(dto: TeamRoleDto): TeamRole {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description ?? null,
  };
}

export function mapParticipantDto(dto: ParticipantDto): Participant {
  const rawStatus = dto.status?.toLowerCase?.() ?? dto.status ?? '';
  const allowedStatuses: Participant['status'][] = ['pending', 'approved', 'rejected'];
  const status = allowedStatuses.includes(rawStatus as Participant['status'])
    ? (rawStatus as Participant['status'])
    : 'pending';

  const roles = (dto.roles ?? []).map(mapTeamRoleDto);
  const roleFromList = roles[0];

  return {
    id: dto.id,
    userId: String(dto.user_id ?? dto.userId ?? ''),
    userName: dto.userName ?? null,
    userEmail: dto.userEmail ?? null,
    roleId: dto.roleId ?? roleFromList?.id ?? null,
    roleName: dto.roleName ?? (roles.length > 0 ? roles.map((r) => r.name).join(', ') : null),
    roles,
    status,
    requestedAt: dto.created_at ?? dto.createdAt ?? dto.requestedAt ?? '',
  };
}

export function mapStudentProjectEventDto(dto: StudentProjectEventDto | null | undefined): StudentProjectEvent | null {
  if (!dto) {
    return null;
  }

  // Бэкенд возвращает snake_case, поэтому используем start_date_time или startDateTime
  const startDateTime = dto.start_date_time ?? dto.startDateTime ?? '';
  const endDateTime = dto.end_date_time ?? dto.endDateTime ?? '';

  return {
    id: String(dto.id),
    title: dto.title,
    startDateTime,
    endDateTime,
  };
}

export function mapStudentProjectDto(dto: StudentProjectDto): StudentProject {
  // Бэкенд возвращает snake_case, поэтому используем creator_id или ownerId
  const ownerId = dto.creator_id !== undefined ? String(dto.creator_id) : String(dto.ownerId ?? '');
  const skills = dto.need_skills ?? dto.skills ?? [];
  const createdAt = dto.created_at ?? dto.createdAt ?? '';
  const updatedAt = dto.updated_at ?? dto.updatedAt ?? '';

  return {
    id: dto.id,
    title: dto.title,
    description: dto.description,
    ownerId,
    ownerName: dto.ownerName ?? null,
    skills: skills.map(mapSkillDto),
    participants: (dto.participants ?? []).map(mapParticipantDto),
    event: mapStudentProjectEventDto(dto.event),
    createdAt,
    updatedAt,
  };
}

export function mapStudentProjectList(
  dtos: ReadonlyArray<StudentProjectDto> | null | undefined,
): ReadonlyArray<StudentProject> {
  if (!dtos) {
    return [];
  }

  return dtos.map(mapStudentProjectDto);
}

