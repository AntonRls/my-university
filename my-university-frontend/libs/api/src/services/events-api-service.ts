/// <reference lib="dom" />
import { apiDelete, apiGet, apiPost } from '@api/shared/api/api-client';

export type EventsTagDto = {
  id: string;
  name: string | null;
};

export type UniversityEventDto = {
  id: number;
  title: string | null;
  description: string | null;
  location: string | null;
  start_date_time: string | null;
  end_date_time: string | null;
  participants_limit: number | null;
  registered_participants_count: number;
  is_current_user_registered: boolean;
  tags: ReadonlyArray<EventsTagDto> | null;
};

export type GetUniversityEventsParams = {
  tagIds?: ReadonlyArray<string>;
  signal?: AbortSignal;
};

export type RegisterForEventOptions = {
  signal?: AbortSignal;
};

class EventsApiService {
  async getEvents(params: GetUniversityEventsParams = {}): Promise<ReadonlyArray<UniversityEventDto>> {
    const { tagIds, signal } = params;
    let path = '/university-events';

    if (tagIds && tagIds.length > 0) {
      const searchParams = new URLSearchParams();

      tagIds.forEach((tagId) => {
        searchParams.append('TagIds', tagId);
      });

      path = `${path}?${searchParams.toString()}`;
    }

    return apiGet<ReadonlyArray<UniversityEventDto>>(path, { signal });
  }

  async getTags(signal?: AbortSignal): Promise<ReadonlyArray<EventsTagDto>> {
    return apiGet<ReadonlyArray<EventsTagDto>>('/university-events/tags', { signal });
  }

  async registerForEvent(eventId: number, options: RegisterForEventOptions = {}): Promise<UniversityEventDto> {
    const { signal } = options;

    return apiPost<UniversityEventDto, Record<string, never>>(
      `/university-events/${eventId}/registrations`,
      {},
      { signal },
    );
  }

  async unregisterFromEvent(eventId: number, options: RegisterForEventOptions = {}): Promise<UniversityEventDto> {
    const { signal } = options;

    return apiDelete<UniversityEventDto>(`/university-events/${eventId}/registrations`, { signal });
  }
}

export const eventsApiService = new EventsApiService();


