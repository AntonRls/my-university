export type ScheduleEntrySourceType = 'AdminLesson' | 'ManualPersonal' | 'UniversityEvent';

export type ScheduleDeliveryType = 'Offline' | 'Online';

export type ScheduleEntrySource = {
  type: ScheduleEntrySourceType;
  referenceId: number | null;
};

export type ScheduleEntry = {
  id: number;
  title: string;
  description: string | null;
  teacher: string | null;
  physicalLocation: string | null;
  onlineLink: string | null;
  startsAt: string;
  endsAt: string;
  deliveryType: ScheduleDeliveryType;
  groupId: number | null;
  ownerUserId: number | null;
  isPersonal: boolean;
  source: ScheduleEntrySource;
};

export type ScheduleEntrySourceDto = {
  type: ScheduleEntrySourceType;
  reference_id: number | null;
};

export type ScheduleEntryDto = {
  id: number;
  title: string;
  description: string | null;
  teacher: string | null;
  physical_location: string | null;
  online_link: string | null;
  starts_at: string;
  ends_at: string;
  delivery_type: ScheduleDeliveryType;
  group_id: number | null;
  owner_user_id: number | null;
  is_personal: boolean;
  source: ScheduleEntrySourceDto;
};

export function mapScheduleEntryDto(dto: ScheduleEntryDto): ScheduleEntry {
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description,
    teacher: dto.teacher,
    physicalLocation: dto.physical_location,
    onlineLink: dto.online_link,
    startsAt: dto.starts_at,
    endsAt: dto.ends_at,
    deliveryType: dto.delivery_type,
    groupId: dto.group_id,
    ownerUserId: dto.owner_user_id,
    isPersonal: dto.is_personal,
    source: {
      type: dto.source.type,
      referenceId: dto.source.reference_id,
    },
  };
}

