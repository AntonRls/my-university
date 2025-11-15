import type { UniversityEvent } from '@api/event';

export const mockEvents: UniversityEvent[] = [
  {
    id: 'evt-001',
    title: 'День проектных команд',
    description:
      'Познакомьтесь с инициативами факультетов и найдите команду для участия в национальных конкурсах.',
    startDateTime: '2025-03-12T15:00:00+03:00',
    endDateTime: '2025-03-12T18:00:00+03:00',
    participantsLimit: 180,
    location: 'Актовый зал, корпус A',
    registeredParticipantsCount: 64,
    isRegistered: false,
    tags: [
      { id: 'tag-networking', name: 'networking' },
      { id: 'tag-projects', name: 'проекты' },
      { id: 'tag-soft-skills', name: 'soft-skills' },
    ],
  },
  {
    id: 'evt-002',
    title: 'Практикум по генеративному ИИ',
    description:
      'Интенсив по работе с LLM и инструментами автоматизации учебных процессов, подготовленный лабораторией ИИ.',
    startDateTime: '2025-03-18T10:00:00+03:00',
    endDateTime: '2025-03-18T13:00:00+03:00',
    participantsLimit: 90,
    location: 'Лаборатория ИИ',
    registeredParticipantsCount: 72,
    isRegistered: true,
    tags: [
      { id: 'tag-ai', name: 'ai' },
      { id: 'tag-workshop', name: 'workshop' },
      { id: 'tag-it', name: 'it' },
    ],
  },
  {
    id: 'evt-003',
    title: 'Карьера в цифровом госсекторе',
    description:
      'Представители Минцифры и партнерских компаний расскажут о летних стажировках и программах поддержки.',
    startDateTime: '2025-03-05T17:30:00+03:00',
    endDateTime: '2025-03-05T19:00:00+03:00',
    participantsLimit: 500,
    location: 'Конференц-зал, этаж 5',
    registeredParticipantsCount: 310,
    isRegistered: false,
    tags: [
      { id: 'tag-career', name: 'карьера' },
      { id: 'tag-internships', name: 'интернатуры' },
      { id: 'tag-government', name: 'госсектор' },
    ],
  },
  {
    id: 'evt-004',
    title: 'Школа молодых исследователей',
    description:
      'Цикл воркшопов по подготовке научных публикаций и участию в грантовых программах фонда «Приоритет».',
    startDateTime: '2025-04-02T09:00:00+03:00',
    endDateTime: '2025-04-04T17:30:00+03:00',
    participantsLimit: 60,
    location: 'Коворкинг «Приоритет»',
    registeredParticipantsCount: 58,
    isRegistered: false,
    tags: [
      { id: 'tag-science', name: 'наука' },
      { id: 'tag-grants', name: 'гранты' },
      { id: 'tag-research', name: 'исследования' },
    ],
  },
  {
    id: 'evt-005',
    title: 'Community meetup: дизайн образовательных продуктов',
    description:
      'Встреча выпускников digital-программ, обсуждаем опыт запуска мини-приложений и ботов MAX.',
    startDateTime: '2025-02-27T19:00:00+03:00',
    endDateTime: '2025-02-27T21:30:00+03:00',
    participantsLimit: 120,
    location: 'Медиацентр, этаж 2',
    registeredParticipantsCount: 118,
    isRegistered: false,
    tags: [
      { id: 'tag-design', name: 'дизайн' },
      { id: 'tag-edtech', name: 'edtech' },
      { id: 'tag-community', name: 'community' },
    ],
  },
  {
    id: 'evt-006',
    title: 'Demo day проектов цифрового вуза',
    description:
      'Финальные презентации команд акселератора. Возможность задать вопросы и присоединиться к проектам второго потока.',
    startDateTime: '2025-03-28T11:00:00+03:00',
    endDateTime: '2025-03-28T14:00:00+03:00',
    participantsLimit: 200,
    location: 'Большой зал MAX HUB',
    registeredParticipantsCount: 200,
    isRegistered: true,
    tags: [
      { id: 'tag-demo', name: 'demo-day' },
      { id: 'tag-accelerator', name: 'акселератор' },
      { id: 'tag-digital', name: 'цифровой вуз' },
    ],
  },
];

