export type UpcomingDeadline = {
  title: string;
  subject: string;
  dueDate: string;
  timeLeft: string;
};

export type DeadlineStatus = 'Active' | 'Completed' | 'Cancelled';

export type DeadlineAccessScope = 'GroupMembers' | 'TeachersOnly' | 'Administrators';

export type DeadlineCompletion = {
  userId: number;
  completedAt: string;
};

export type Deadline = {
  id: number;
  groupId: number;
  title: string;
  descriptionHtml: string;
  dueAt: string;
  status: DeadlineStatus;
  accessScope: DeadlineAccessScope;
  scheduleEntryId: number | null;
  completedAt: string | null;
  completions: DeadlineCompletion[];
};

export type CreateDeadlinePayload = {
  groupId: number;
  title: string;
  descriptionHtml: string;
  dueAt: string;
  accessScope: DeadlineAccessScope;
  scheduleEntryId?: number | null;
};

export type UpdateDeadlinePayload = {
  title: string;
  descriptionHtml: string;
  dueAt: string;
  accessScope: DeadlineAccessScope;
  scheduleEntryId?: number | null;
};

export type DeadlineDto = {
  id: number;
  group_id: number;
  title: string;
  description_html: string;
  due_at: string;
  status: DeadlineStatus;
  access_scope: DeadlineAccessScope;
  schedule_entry_id: number | null;
  completed_at: string | null;
  completions: Array<{
    user_id: number;
    completed_at: string;
  }>;
};

export function mapDeadlineDto(dto: DeadlineDto): Deadline {
  return {
    id: dto.id,
    groupId: dto.group_id,
    title: dto.title,
    descriptionHtml: dto.description_html,
    dueAt: dto.due_at,
    status: dto.status,
    accessScope: dto.access_scope,
    scheduleEntryId: dto.schedule_entry_id,
    completedAt: dto.completed_at,
    completions: dto.completions.map((item) => ({
      userId: item.user_id,
      completedAt: item.completed_at,
    })),
  };
}


