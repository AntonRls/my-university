import type { EventsTagDto, UniversityEventDto } from '@api/services/events-api-service';
import type { EventTag, UniversityEvent } from '@api/event';

export function mapEventsTagDto(dto: EventsTagDto): EventTag {
  return {
    id: dto.id,
    name: normalizeTagName(dto.name),
  };
}

export function mapUniversityEventDto(dto: UniversityEventDto): UniversityEvent {
  return {
    id: String(dto.id),
    title: normalizeText(dto.title) ?? 'Без названия',
    description: normalizeText(dto.description) ?? 'Описание появится позже',
    location: normalizeText(dto.location) ?? 'Место уточняется',
    startDateTime: dto.start_date_time ?? '',
    endDateTime: dto.end_date_time ?? '',
    participantsLimit: dto.participants_limit ?? null,
    registeredParticipantsCount: dto.registered_participants_count ?? 0,
    isRegistered: dto.is_current_user_registered ?? false,
    tags: (dto.tags ?? []).map(mapEventsTagDto),
  };
}

export function mapUniversityEventList(dtos: ReadonlyArray<UniversityEventDto>): UniversityEvent[] {
  return dtos.map(mapUniversityEventDto);
}

function normalizeTagName(name: string | null): string {
  const trimmed = normalizeText(name);

  if (!trimmed) {
    return 'Без тега';
  }

  return trimmed;
}

function normalizeText(value: string | null): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}


