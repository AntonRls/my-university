import { apiGet, apiPost } from '@api/shared/api/api-client';
import { buildTenantHeaders } from '@api/shared/api/tenant';

import { mapStructureTreeDto, mapUserGroupDto } from '../model/structure';
import type {
  StructureTree,
  DegreeLevel,
  GroupType,
  CustomGroupCreatorRole,
  CustomGroupVisibility,
  CustomGroupModerationStatus,
  GroupMembershipType,
  UserGroup,
} from '../model/structure';

type FetchStructureOptions = {
  signal?: AbortSignal;
};

type CreateFacultyPayload = {
  name: string;
  code: string;
};

type CreateProgramPayload = {
  facultyId: number;
  name: string;
  degreeLevel: DegreeLevel | string;
};

type CreateProgramCoursePayload = {
  facultyId: number;
  programId: number;
  courseNumber: number;
  title: string;
  ects: number | null;
};

type CreateGroupPayload = {
  facultyId: number;
  programId: number;
  courseId: number;
  type: GroupType;
  label: string;
  capacity: number;
  isPrimaryAllowed: boolean;
  customMeta?: {
    createdByUserId: number | null;
    createdByRole: CustomGroupCreatorRole;
    visibility: CustomGroupVisibility;
    moderationStatus: CustomGroupModerationStatus;
  };
};

type AddGroupMemberPayload = {
  groupId: number;
  studentId: number;
  membershipType: GroupMembershipType;
};

export async function fetchStructureTree(
  options?: FetchStructureOptions,
): Promise<StructureTree> {
  const response = await apiGet<Parameters<typeof mapStructureTreeDto>[0]>('/structure/tree', {
    signal: options?.signal,
    headers: buildTenantHeaders(),
  });

  return mapStructureTreeDto(response);
}

export function createFaculty(payload: CreateFacultyPayload): Promise<number> {
  return apiPost<number, CreateFacultyPayload>('/structure/faculties', payload, {
    headers: buildTenantHeaders(),
  });
}

export function createProgram(payload: CreateProgramPayload): Promise<number> {
  const { facultyId, name, degreeLevel } = payload;

  return apiPost<
    number,
    {
      name: string;
      degree_level: typeof degreeLevel;
    }
  >(
    `/structure/faculties/${facultyId}/programs`,
    {
      name,
      degree_level: degreeLevel,
    },
    {
      headers: buildTenantHeaders(),
    },
  );
}

export function createProgramCourse(payload: CreateProgramCoursePayload): Promise<number> {
  const { facultyId, programId, courseNumber, title, ects } = payload;

  return apiPost<
    number,
    {
      course_number: number;
      title: string;
      ects: number | null;
    }
  >(
    `/structure/faculties/${facultyId}/programs/${programId}/courses`,
    {
      course_number: courseNumber,
      title,
      ects,
    },
    {
      headers: buildTenantHeaders(),
    },
  );
}

export function createGroup(payload: CreateGroupPayload): Promise<number> {
  const { facultyId, programId, courseId, ...rest } = payload;
  const customMeta = rest.customMeta
    ? {
        created_by_user_id: rest.customMeta.createdByUserId,
        created_by_role: rest.customMeta.createdByRole,
        visibility: rest.customMeta.visibility,
        moderation_status: rest.customMeta.moderationStatus,
      }
    : undefined;

  return apiPost<
    number,
    {
      type: GroupType;
      label: string;
      capacity: number;
      is_primary_allowed: boolean;
      custom_meta?: {
        created_by_user_id: number | null;
        created_by_role: CustomGroupCreatorRole;
        visibility: CustomGroupVisibility;
        moderation_status: CustomGroupModerationStatus;
      };
    }
  >(
    `/structure/faculties/${facultyId}/programs/${programId}/courses/${courseId}/groups`,
    {
      type: rest.type,
      label: rest.label,
      capacity: rest.capacity,
      is_primary_allowed: rest.isPrimaryAllowed,
      custom_meta: customMeta,
    },
    {
      headers: buildTenantHeaders(),
    },
  );
}

export function addGroupMember(payload: AddGroupMemberPayload): Promise<void> {
  return apiPost<
    void,
    {
      student_id: number;
      membership_type: GroupMembershipType;
    }
  >(
    `/structure/groups/${payload.groupId}/members`,
    {
      student_id: payload.studentId,
      membership_type: payload.membershipType,
    },
    {
      headers: buildTenantHeaders(),
    },
  );
}

export async function fetchMyGroups(options?: { signal?: AbortSignal }): Promise<UserGroup[]> {
  const response = await apiGet<
    Array<Parameters<typeof mapUserGroupDto>[0]>
  >('/structure/me/groups', {
    signal: options?.signal,
    headers: buildTenantHeaders(),
  });

  return response.map(mapUserGroupDto);
}


