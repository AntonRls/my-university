import { apiPost } from '@api/shared/api/api-client';

import type { ScheduleDeliveryType } from '../model/schedule';

export type CreatePersonalSlotPayload = {
  title: string;
  description?: string | null;
  teacher?: string | null;
  deliveryType: ScheduleDeliveryType;
  physicalLocation?: string | null;
  onlineLink?: string | null;
  startsAt: string;
  endsAt: string;
};

export async function createPersonalSlot(payload: CreatePersonalSlotPayload): Promise<number> {
  const response = await apiPost<
    number,
    {
      title: string;
      description?: string | null;
      teacher?: string | null;
      delivery_type: ScheduleDeliveryType;
      physical_location?: string | null;
      online_link?: string | null;
      starts_at: string;
      ends_at: string;
    }
  >('/schedule/me/slots', {
    title: payload.title,
    description: payload.description || null,
    teacher: payload.teacher || null,
    delivery_type: payload.deliveryType,
    physical_location: payload.physicalLocation || null,
    online_link: payload.onlineLink || null,
    starts_at: payload.startsAt,
    ends_at: payload.endsAt,
  });
  return response;
}

