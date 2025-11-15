export type {
  UpcomingDeadline,
  Deadline,
  DeadlineStatus,
  DeadlineAccessScope,
  DeadlineCompletion,
  CreateDeadlinePayload,
  UpdateDeadlinePayload,
} from './model/deadline';
export {
  fetchMyDeadlines,
  fetchGroupDeadlines,
  createDeadline,
  updateDeadline,
  completeDeadline,
  deleteDeadline,
  linkDeadlineToLesson,
} from './api/deadlines';

