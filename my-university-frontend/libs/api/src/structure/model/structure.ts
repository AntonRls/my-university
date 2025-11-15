export type DegreeLevel = 'Bachelor' | 'Master' | 'Specialist' | 'PhD';

export type GroupType = 'Main' | 'CustomAdmin' | 'CustomUser';

export type GroupMembershipType = 'Primary' | 'Auxiliary';

export type CustomGroupCreatorRole = 'Student' | 'Teacher' | 'Admin';

export type CustomGroupVisibility = 'Private' | 'Tenant';

export type CustomGroupModerationStatus = 'Pending' | 'Approved' | 'Blocked';

export type CustomGroupMeta = {
  createdByUserId: number | null;
  createdByRole: CustomGroupCreatorRole;
  visibility: CustomGroupVisibility;
  moderationStatus: CustomGroupModerationStatus;
};

export type GroupMember = {
  studentId: number;
  membershipType: GroupMembershipType;
};

export type GroupNode = {
  id: number;
  label: string;
  type: GroupType;
  isPrimaryAllowed: boolean;
  members: GroupMember[];
  customMeta: CustomGroupMeta | null;
};

export type CourseNode = {
  id: number;
  courseNumber: number;
  title: string;
  groups: GroupNode[];
};

export type ProgramNode = {
  id: number;
  name: string;
  degreeLevel: string;
  courses: CourseNode[];
};

export type FacultyNode = {
  id: number;
  name: string;
  code: string;
  programs: ProgramNode[];
};

export type StructureTree = {
  faculties: FacultyNode[];
};

export type UserGroup = {
  id: number;
  label: string;
  type: GroupType;
  isPrimaryAllowed: boolean;
  customMeta: CustomGroupMeta | null;
};

type UserGroupDto = {
  id: number;
  label: string;
  type: GroupType;
  is_primary_allowed: boolean;
  custom_meta: CustomGroupMetaDto | null;
};

type CustomGroupMetaDto = {
  created_by_user_id: number | null;
  created_by_role: CustomGroupCreatorRole;
  visibility: CustomGroupVisibility;
  moderation_status: CustomGroupModerationStatus;
};

type GroupMemberDto = {
  student_id: number;
  membership_type: GroupMembershipType;
};

type GroupNodeDto = {
  id: number;
  label: string;
  type: GroupType;
  is_primary_allowed: boolean;
  members: GroupMemberDto[];
  custom_meta: CustomGroupMetaDto | null;
};

type CourseNodeDto = {
  id: number;
  course_number: number;
  title: string;
  groups: GroupNodeDto[];
};

type ProgramNodeDto = {
  id: number;
  name: string;
  degree_level: string;
  courses: CourseNodeDto[];
};

type FacultyNodeDto = {
  id: number;
  name: string;
  code: string;
  programs: ProgramNodeDto[];
};

type StructureTreeDto = {
  faculties: FacultyNodeDto[];
};

function mapCustomGroupMetaDto(dto: CustomGroupMetaDto): CustomGroupMeta {
  return {
    createdByUserId: dto.created_by_user_id,
    createdByRole: dto.created_by_role,
    visibility: dto.visibility,
    moderationStatus: dto.moderation_status,
  };
}

function mapGroupMemberDto(dto: GroupMemberDto): GroupMember {
  return {
    studentId: dto.student_id,
    membershipType: dto.membership_type,
  };
}

function mapGroupNodeDto(dto: GroupNodeDto): GroupNode {
  return {
    id: dto.id,
    label: dto.label,
    type: dto.type,
    isPrimaryAllowed: dto.is_primary_allowed,
    members: dto.members.map(mapGroupMemberDto),
    customMeta: dto.custom_meta ? mapCustomGroupMetaDto(dto.custom_meta) : null,
  };
}

function mapCourseNodeDto(dto: CourseNodeDto): CourseNode {
  return {
    id: dto.id,
    courseNumber: dto.course_number,
    title: dto.title,
    groups: dto.groups.map(mapGroupNodeDto),
  };
}

function mapProgramNodeDto(dto: ProgramNodeDto): ProgramNode {
  return {
    id: dto.id,
    name: dto.name,
    degreeLevel: dto.degree_level,
    courses: dto.courses.map(mapCourseNodeDto),
  };
}

function mapFacultyNodeDto(dto: FacultyNodeDto): FacultyNode {
  return {
    id: dto.id,
    name: dto.name,
    code: dto.code,
    programs: dto.programs.map(mapProgramNodeDto),
  };
}

export function mapStructureTreeDto(dto: StructureTreeDto): StructureTree {
  return {
    faculties: dto.faculties.map(mapFacultyNodeDto),
  };
}

export function mapUserGroupDto(dto: UserGroupDto): UserGroup {
  return {
    id: dto.id,
    label: dto.label,
    type: dto.type,
    isPrimaryAllowed: dto.is_primary_allowed,
    customMeta: dto.custom_meta ? mapCustomGroupMetaDto(dto.custom_meta) : null,
  };
}


