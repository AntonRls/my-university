/// <reference lib="dom" />
import { apiGet, apiPost, apiPut, apiDelete } from '@api/shared/api/api-client';

export type SkillDto = {
  id: string;
  name: string;
};

export type TeamRoleDto = {
  id: string;
  name: string;
  description?: string | null;
};

export type ParticipantDto = {
  id: string;
  user_id: number;
  userId?: string;
  userName?: string | null;
  userEmail?: string | null;
  roleId?: string | null;
  roleName?: string | null;
  status: string;
  is_creator?: boolean;
  created_at?: string;
  requestedAt?: string;
  createdAt?: string;
  roles?: ReadonlyArray<TeamRoleDto>;
};

export type StudentProjectEventDto = {
  id: number;
  title: string;
  start_date_time: string; // Приходит с бэкенда в snake_case
  end_date_time: string; // Приходит с бэкенда в snake_case
  startDateTime?: string; // Для обратной совместимости
  endDateTime?: string; // Для обратной совместимости
};

export type StudentProjectDto = {
  id: string;
  title: string;
  description: string | null;
  creator_id: number; // Приходит с бэкенда в snake_case
  ownerId?: string | number; // Для обратной совместимости (если придет в camelCase)
  ownerName?: string | null;
  skills?: ReadonlyArray<SkillDto> | null;
  need_skills?: ReadonlyArray<SkillDto> | null; // Приходит с бэкенда в snake_case
  participants?: ReadonlyArray<ParticipantDto> | null;
  event?: StudentProjectEventDto | null;
  created_at?: string; // Приходит с бэкенда в snake_case
  updated_at?: string; // Приходит с бэкенда в snake_case
  createdAt?: string; // Для обратной совместимости
  updatedAt?: string; // Для обратной совместимости
};

export type CreateStudentProjectParams = {
  title: string;
  description?: string | null;
  existingSkills?: ReadonlyArray<{ id: string; name: string }>;
  newSkills?: ReadonlyArray<{ id: string; name: string }>;
  eventId?: string | null;
  signal?: AbortSignal;
};

export type UpdateStudentProjectParams = {
  projectId: string;
  title?: string;
  description?: string | null;
  existingSkills?: ReadonlyArray<{ id: string; name: string }>;
  newSkills?: ReadonlyArray<{ id: string; name: string }>;
  eventId?: string | null;
  signal?: AbortSignal;
};

export type CreateParticipantRequestParams = {
  projectId: string;
  roleId?: string | null;
  signal?: AbortSignal;
};

export type ApproveParticipantParams = {
  projectId: string;
  participantId: string;
  signal?: AbortSignal;
};

export type RejectParticipantParams = {
  projectId: string;
  participantId: string;
  signal?: AbortSignal;
};

export type UpdateParticipantRoleParams = {
  projectId: string;
  participantId: string;
  roleIds: ReadonlyArray<string>;
  newRoles?: ReadonlyArray<{ name: string; description?: string | null }>;
  signal?: AbortSignal;
};

export type CreateTeamRoleParams = {
  name: string;
  description?: string | null;
  signal?: AbortSignal;
};

class StudentProjectsApiService {
  async getProjects(signal?: AbortSignal): Promise<ReadonlyArray<StudentProjectDto>> {
    const result = await apiGet<ReadonlyArray<StudentProjectDto> | null | undefined>(
      '/student-projects',
      { signal },
    );
    return result ?? [];
  }

  createProject(params: CreateStudentProjectParams): Promise<StudentProjectDto> {
    const { existingSkills, newSkills, eventId, signal, ...rest } = params;
    const payload: {
      title: string;
      description?: string | null;
      need_skills?: ReadonlyArray<{ id: string; name: string }>;
      event_id?: number | null;
    } = {
      title: rest.title,
    };

    if (rest.description !== undefined) {
      payload.description = rest.description;
    }

    const allSkills: Array<{ id: string; name: string }> = [];
    
    if (existingSkills && existingSkills.length > 0) {
      allSkills.push(...existingSkills.map((skill) => ({ id: skill.id, name: skill.name })));
    }

    if (newSkills && newSkills.length > 0) {
      allSkills.push(...newSkills);
    }

    if (allSkills.length > 0) {
      payload.need_skills = allSkills;
    }

    if (eventId !== undefined) {
      payload.event_id = eventId ? Number.parseInt(eventId, 10) : null;
    }

    return apiPost<StudentProjectDto, typeof payload>('/student-projects', payload, { signal });
  }

  updateProject(params: UpdateStudentProjectParams): Promise<StudentProjectDto> {
    const { projectId, existingSkills, newSkills, eventId, signal, ...rest } = params;
    const payload: {
      title?: string;
      description?: string | null;
      need_skills?: ReadonlyArray<{ id: string; name: string }>;
      event_id?: number | null;
    } = {};

    if (rest.title !== undefined) {
      payload.title = rest.title;
    }

    if (rest.description !== undefined) {
      payload.description = rest.description;
    }

    const allSkills: Array<{ id: string; name: string }> = [];
    
    if (existingSkills && existingSkills.length > 0) {
      allSkills.push(...existingSkills.map((skill) => ({ id: skill.id, name: skill.name })));
    }

    if (newSkills && newSkills.length > 0) {
      allSkills.push(...newSkills);
    }

    if (allSkills.length > 0) {
      payload.need_skills = allSkills;
    }

    if (eventId !== undefined) {
      payload.event_id = eventId ? Number.parseInt(eventId, 10) : null;
    }

    return apiPut<StudentProjectDto, typeof payload>(
      `/student-projects/${projectId}`,
      payload,
      { signal },
    );
  }

  createParticipantRequest(
    params: CreateParticipantRequestParams,
  ): Promise<ParticipantDto> {
    const { projectId, roleId, signal } = params;
    const payload: {
      role_id?: string | null;
    } = {};

    if (roleId !== undefined) {
      payload.role_id = roleId;
    }

    return apiPost<ParticipantDto, typeof payload>(
      `/student-projects/${projectId}/participants/requests`,
      payload,
      { signal },
    );
  }

  approveParticipant(params: ApproveParticipantParams): Promise<ParticipantDto> {
    const { projectId, participantId, signal } = params;
    return apiPost<ParticipantDto, Record<string, never>>(
      `/student-projects/${projectId}/participants/${participantId}/approve`,
      {},
      { signal },
    );
  }

  rejectParticipant(params: RejectParticipantParams): Promise<ParticipantDto> {
    const { projectId, participantId, signal } = params;
    return apiPost<ParticipantDto, undefined>(
      `/student-projects/${projectId}/participants/${participantId}/reject`,
      undefined,
      { signal },
    );
  }

  updateParticipantRole(params: UpdateParticipantRoleParams): Promise<ParticipantDto> {
    const { projectId, participantId, roleIds, newRoles, signal } = params;
    const payload: {
      role_ids: ReadonlyArray<string>;
      new_roles?: ReadonlyArray<{ name: string; description?: string | null }>;
    } = {
      role_ids: roleIds,
    };

    if (newRoles && newRoles.length > 0) {
      payload.new_roles = newRoles;
    }

    return apiPut<ParticipantDto, typeof payload>(
      `/student-projects/${projectId}/participants/${participantId}/roles`,
      payload,
      { signal },
    );
  }

  removeParticipant(params: {
    projectId: string;
    participantId: string;
    signal?: AbortSignal;
  }): Promise<void> {
    const { projectId, participantId, signal } = params;
    return apiDelete<void>(`/student-projects/${projectId}/participants/${participantId}`, {
      signal,
    });
  }

  getSkills(signal?: AbortSignal): Promise<ReadonlyArray<SkillDto>> {
    return apiGet<ReadonlyArray<SkillDto>>('/student-projects/skills', { signal });
  }

  getTeamRoles(signal?: AbortSignal): Promise<ReadonlyArray<TeamRoleDto>> {
    return apiGet<ReadonlyArray<TeamRoleDto>>('/student-projects/team-roles', { signal });
  }

  createTeamRole(params: CreateTeamRoleParams): Promise<TeamRoleDto> {
    const { name, description, signal } = params;
    const payload: {
      name: string;
      description?: string | null;
    } = {
      name,
    };

    if (description !== undefined) {
      payload.description = description;
    }

    return apiPost<TeamRoleDto, typeof payload>('/student-projects/team-roles', payload, {
      signal,
    });
  }

}

export const studentProjectsApiService = new StudentProjectsApiService();

