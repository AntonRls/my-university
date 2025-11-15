import { apiGet } from '@api/shared/api/api-client';

import {
  type ScheduleEntry,
  type ScheduleEntryDto,
  mapScheduleEntryDto,
} from '../model/schedule';

export type FetchGroupScheduleParams = {
  groupId: number;
  from?: string;
  to?: string;
  signal?: AbortSignal;
};

export async function fetchGroupSchedule(params: FetchGroupScheduleParams): Promise<ScheduleEntry[]> {
  const { groupId, from, to, signal } = params;

  const searchParams = new URLSearchParams();

  if (from) {
    searchParams.set('from', from);
  }

  if (to) {
    searchParams.set('to', to);
  }

  const query = searchParams.toString();
  const path = query ? `/schedule/groups/${groupId}?${query}` : `/schedule/groups/${groupId}`;

  const response = await apiGet<ScheduleEntryDto[]>(path, { signal });
  return response.map(mapScheduleEntryDto);
}

