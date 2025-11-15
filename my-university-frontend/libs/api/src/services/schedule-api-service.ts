import type { FetchMyScheduleParams, ScheduleEntry } from '@api/schedule';
import { fetchGroupSchedule, fetchMySchedule } from '@api/schedule';

class ScheduleApiService {
  async getMySchedule(params: FetchMyScheduleParams = {}): Promise<ReadonlyArray<ScheduleEntry>> {
    return fetchMySchedule(params);
  }

  async getGroupSchedule(groupId: number): Promise<ReadonlyArray<ScheduleEntry>> {
    return fetchGroupSchedule({ groupId });
  }
}

export const scheduleApiService = new ScheduleApiService();

export type { FetchMyScheduleParams, FetchGroupScheduleParams } from '@api/schedule';

