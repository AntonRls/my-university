import { apiGet } from '@api/shared/api/api-client';

import {
  type ScheduleDeliveryType,
  type ScheduleEntry,
  type ScheduleEntryDto,
  mapScheduleEntryDto,
} from '../model/schedule';

export type FetchMyScheduleParams = {
  from?: string;
  to?: string;
  deliveryType?: ScheduleDeliveryType;
  signal?: AbortSignal;
};

export async function fetchMySchedule(
  params: FetchMyScheduleParams = {},
): Promise<ReadonlyArray<ScheduleEntry>> {
  const { from, to, deliveryType, signal } = params;

  const searchParams = new URLSearchParams();

  if (from) {
    searchParams.set('from', from);
  }

  if (to) {
    searchParams.set('to', to);
  }

  if (deliveryType) {
    searchParams.set('delivery_type', deliveryType);
  }

  const query = searchParams.toString();
  const path = query ? `/schedule/me?${query}` : '/schedule/me';

  const response = await apiGet<ReadonlyArray<ScheduleEntryDto>>(path, { signal });

  return response.map(mapScheduleEntryDto);
}

