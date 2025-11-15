import { apiDelete, apiGet, apiPost, apiPut } from '@api/shared/api/api-client';

import {
  mapEventTagDto,
  mapUniversityEventDto,
  type EventTag,
  type EventTagDto,
  type EventWritePayload,
  type UniversityEvent,
  type UniversityEventDto,
} from '../model';

type FetchEventsOptions = {
  signal?: AbortSignal;
};

type EventRequestBody = {
  title: string;
  description: string;
  location: string;
  participants_limit: number | null;
  start_date_time: string;
  end_date_time: string;
  tags: ReadonlyArray<EventTagDto>;
};

function mapToRequestPayload(payload: EventWritePayload): EventRequestBody {
  return {
    title: payload.title,
    description: payload.description,
    location: payload.location,
    participants_limit: payload.participantsLimit,
    start_date_time: payload.startDateTime,
    end_date_time: payload.endDateTime,
    tags: payload.tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
    })),
  };
}

export async function fetchUniversityEvents(
  options?: FetchEventsOptions,
): Promise<ReadonlyArray<UniversityEvent>> {
  const response = await apiGet<ReadonlyArray<UniversityEventDto>>('/university-events', {
    signal: options?.signal,
  });

  return response.map(mapUniversityEventDto);
}

export async function fetchUniversityEvent(
  id: number,
  options?: FetchEventsOptions,
): Promise<UniversityEvent> {
  const response = await apiGet<UniversityEventDto>(`/university-events/${id}`, {
    signal: options?.signal,
  });

  return mapUniversityEventDto(response);
}

export async function fetchUniversityEventTags(
  options?: FetchEventsOptions,
): Promise<ReadonlyArray<EventTag>> {
  const response = await apiGet<ReadonlyArray<EventTagDto>>('/university-events/tags', {
    signal: options?.signal,
  });

  return response.map(mapEventTagDto);
}

export async function createUniversityEvent(payload: EventWritePayload): Promise<void> {
  await apiPost<null, EventRequestBody>('/university-events', mapToRequestPayload(payload));
}

export async function updateUniversityEvent(id: number, payload: EventWritePayload): Promise<void> {
  await apiPut<null, EventRequestBody>(`/university-events/${id}`, mapToRequestPayload(payload));
}

export async function deleteUniversityEvent(id: number): Promise<void> {
  await apiDelete<null>(`/university-events/${id}`);
}

export async function createUniversityEventTag(name: string): Promise<EventTag> {
  const response = await apiPost<EventTagDto, { name: string }>('/university-events/tags', {
    name,
  });
  return mapEventTagDto(response);
}

export type EventRegistrationDto = {
  id: number;
  user_id: number;
  user_first_name: string;
  user_last_name: string;
  user_username?: string | null;
  user_email?: string | null;
  created_at: string;
};

export type EventRegistration = {
  id: number;
  userId: number;
  userFirstName: string;
  userLastName: string;
  userUsername?: string | null;
  userEmail?: string | null;
  createdAt: string;
};

function mapEventRegistrationDto(dto: EventRegistrationDto): EventRegistration {
  return {
    id: dto.id,
    userId: dto.user_id,
    userFirstName: dto.user_first_name,
    userLastName: dto.user_last_name,
    userUsername: dto.user_username ?? null,
    userEmail: dto.user_email ?? null,
    createdAt: dto.created_at,
  };
}

export async function fetchEventRegistrations(
  eventId: number,
  options?: FetchEventsOptions,
): Promise<ReadonlyArray<EventRegistration>> {
  const response = await apiGet<ReadonlyArray<EventRegistrationDto>>(
    `/university-events/${eventId}/registrations`,
    {
      signal: options?.signal,
    },
  );

  return response.map(mapEventRegistrationDto);
}

