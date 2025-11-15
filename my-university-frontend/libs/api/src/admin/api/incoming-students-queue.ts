import { apiGet, apiPost, apiPut } from '@api/shared/api/api-client';
import { buildTenantHeaders } from '@api/shared/api/tenant';

import {
  mapIncomingStudentDto,
  type AdminRole,
  type ApproveStatus,
  type IncomingStudent,
  type IncomingStudentDto,
} from '../model';

type FetchQueueOptions = {
  signal?: AbortSignal;
};

type UpdateApproveStatusPayload = {
  approve_status: Extract<ApproveStatus, 'Approved' | 'Rejected'>;
};

type RequestJoinPayload = {
  role: AdminRole;
};

export async function fetchIncomingStudentsQueue(
  options?: FetchQueueOptions,
): Promise<IncomingStudent[]> {
  const response = await apiGet<IncomingStudentDto[]>('/admin/incoming-students-queue', {
    signal: options?.signal,
  });

  return response.map(mapIncomingStudentDto);
}

export async function updateIncomingStudentStatus(
  studentId: number,
  approveStatus: Extract<ApproveStatus, 'Approved' | 'Rejected'>,
): Promise<void> {
  await apiPut<null, UpdateApproveStatusPayload>(
    `/admin/incoming-students-queue/${studentId}`,
    { approve_status: approveStatus },
  );
}

export async function requestJoinUniversity(role: AdminRole, tenantId?: string | number): Promise<void> {
  const headers =
    tenantId !== undefined
      ? buildTenantHeaders({ 'X-Tenant-Id': String(tenantId) })
      : buildTenantHeaders();

  await apiPost<null, RequestJoinPayload>('/admin/incoming-students-queue', { role }, { headers });
}

