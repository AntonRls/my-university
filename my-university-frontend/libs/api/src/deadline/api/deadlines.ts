import { apiDelete, apiGet, apiPost, apiPut } from '@api/shared/api/api-client';
import { buildTenantHeaders } from '@api/shared/api/tenant';

import {
  mapDeadlineDto,
  type CreateDeadlinePayload,
  type Deadline,
  type DeadlineDto,
  type UpdateDeadlinePayload,
} from '../model/deadline';

type FetchMyDeadlinesOptions = {
  onlyActive?: boolean;
  signal?: AbortSignal;
};

export async function fetchMyDeadlines(options: FetchMyDeadlinesOptions = {}): Promise<Deadline[]> {
  const searchParams = new URLSearchParams();

  if (options.onlyActive !== undefined) {
    searchParams.set('onlyActive', options.onlyActive ? 'true' : 'false');
  }

  const query = searchParams.toString();
  const path = query ? `/deadlines/me?${query}` : '/deadlines/me';

  const response = await apiGet<DeadlineDto[]>(path, {
    signal: options.signal,
    headers: buildTenantHeaders(),
  });

  return response.map(mapDeadlineDto);
}

export async function fetchGroupDeadlines(groupId: number, signal?: AbortSignal): Promise<Deadline[]> {
  const response = await apiGet<DeadlineDto[]>(`/deadlines/groups/${groupId}`, {
    signal,
    headers: buildTenantHeaders(),
  });

  return response.map(mapDeadlineDto);
}

export function createDeadline(params: CreateDeadlinePayload): Promise<number> {
  const { groupId, ...rest } = params;
  const payload: Omit<CreateDeadlinePayload, 'groupId'> = rest;

  return apiPost<number, Omit<CreateDeadlinePayload, 'groupId'>>(`/deadlines/groups/${groupId}`, payload, {
    headers: buildTenantHeaders(),
  });
}

export function updateDeadline(deadlineId: number, payload: UpdateDeadlinePayload): Promise<void> {
  return apiPut<void, UpdateDeadlinePayload>(`/deadlines/${deadlineId}`, payload, {
    headers: buildTenantHeaders(),
  });
}

export function completeDeadline(deadlineId: number): Promise<void> {
  return apiPost<void, Record<string, never>>(`/deadlines/${deadlineId}/complete`, {}, { headers: buildTenantHeaders() });
}

export function deleteDeadline(deadlineId: number): Promise<void> {
  return apiDelete<void>(`/deadlines/${deadlineId}`, { headers: buildTenantHeaders() });
}

export function linkDeadlineToLesson(deadlineId: number, scheduleEntryId: number): Promise<void> {
  return apiPost<
    void,
    {
      schedule_entry_id: number;
    }
  >(
    `/deadlines/${deadlineId}/link-schedule`,
    {
      schedule_entry_id: scheduleEntryId,
    },
    { headers: buildTenantHeaders() },
  );
}

