import { apiPost } from '@api/shared/api/api-client';

type CreateGroupLessonPayload = {
  groupId: number;
  title: string;
  description: string;
  teacher?: string;
  deliveryType: 'Online' | 'Offline';
  physicalLocation?: string;
  onlineLink?: string;
  startsAt: string;
  endsAt: string;
};

export async function createGroupLesson(payload: CreateGroupLessonPayload): Promise<void> {
  await apiPost<
    void,
    {
      title: string;
      description: string;
      teacher: string | null;
      delivery_type: 'Online' | 'Offline';
      physical_location: string | null;
      online_link: string | null;
      starts_at: string;
      ends_at: string;
    }
  >(`/schedule/groups/${payload.groupId}/lessons`, {
    title: payload.title,
    description: payload.description,
    teacher: payload.teacher?.trim() ? payload.teacher.trim() : null,
    delivery_type: payload.deliveryType,
    physical_location:
      payload.deliveryType === 'Offline' && payload.physicalLocation?.trim()
        ? payload.physicalLocation.trim()
        : null,
    online_link:
      payload.deliveryType === 'Online' && payload.onlineLink?.trim()
        ? payload.onlineLink.trim()
        : null,
    starts_at: payload.startsAt,
    ends_at: payload.endsAt,
  });
}

