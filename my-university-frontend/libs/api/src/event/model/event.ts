export type EventSortOrder = 'desc' | 'asc';

export type EventTag = {
  id: string;
  name: string;
};

export type UniversityEvent = {
  id: string;
  title: string;
  description: string;
  location: string;
  startDateTime: string;
  endDateTime: string;
  participantsLimit: number | null;
  registeredParticipantsCount: number;
  isRegistered: boolean;
  tags: ReadonlyArray<EventTag>;
};

