export type AdminRole = 'Student' | 'Teacher';

export type ApproveStatus = 'Approved' | 'WaitApprove' | 'Rejected';

export type IncomingStudentDto = {
  id: number;
  first_name: string;
  last_name: string;
  username: string | null;
  role: AdminRole;
};

export type IncomingStudent = {
  id: number;
  firstName: string;
  lastName: string;
  username: string | null;
  role: AdminRole;
};

export function mapIncomingStudentDto(dto: IncomingStudentDto): IncomingStudent {
  return {
    id: dto.id,
    firstName: dto.first_name,
    lastName: dto.last_name,
    username: dto.username,
    role: dto.role,
  };
}

export type EventTagDto = {
  id: string;
  name: string | null;
};

export type EventTag = {
  id: string;
  name: string;
};

export function mapEventTagDto(dto: EventTagDto): EventTag {
  return {
    id: dto.id,
    name: dto.name ?? 'Без названия',
  };
}

export type UniversityEventDto = {
  id: number;
  title: string | null;
  description: string | null;
  location: string | null;
  participants_limit: number | null;
  start_date_time: string | null;
  end_date_time: string | null;
  registered_participants_count: number;
  is_current_user_registered: boolean;
  tags: ReadonlyArray<EventTagDto> | null;
};

export type UniversityEvent = {
  id: number;
  title: string;
  description: string;
  location: string;
  participantsLimit: number | null;
  startDateTime: string;
  endDateTime: string;
  registeredParticipantsCount: number;
  tags: ReadonlyArray<EventTag>;
};

export function mapUniversityEventDto(dto: UniversityEventDto): UniversityEvent {
  return {
    id: dto.id,
    title: dto.title ?? 'Без названия',
    description: dto.description ?? '',
    location: dto.location ?? 'Место уточняется',
    participantsLimit: dto.participants_limit,
    startDateTime: dto.start_date_time ?? '',
    endDateTime: dto.end_date_time ?? '',
    registeredParticipantsCount: dto.registered_participants_count ?? 0,
    tags: (dto.tags ?? []).map(mapEventTagDto),
  };
}

export type EventWritePayload = {
  title: string;
  description: string;
  location: string;
  participantsLimit: number | null;
  startDateTime: string;
  endDateTime: string;
  tags: ReadonlyArray<EventTag>;
};

