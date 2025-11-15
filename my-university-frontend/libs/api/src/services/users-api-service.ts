/// <reference lib="dom" />
import { apiGet, apiRequest } from '@api/shared/api/api-client';
import { getAdminApiBaseUrl } from '@api/shared/api/config';
import { buildTenantHeaders, getTenantId } from '@api/shared/api/tenant';

const APPROVE_STATUS_NUMBER_MAP: Record<number, UserUniversityApproveStatus> = {
  0: 'Approved',
  1: 'Wait',
  2: 'Rejected',
};

export type SimpleUserDto = {
  id: number;
  first_name: string;
  last_name: string;
  username?: string | null;
  email?: string | null;
  university_ids?: ReadonlyArray<number> | null;
  university_name?: string | null;
  role?: 'Student' | 'Teacher' | null;
};

export type UserRole = 'Student' | 'Teacher';

export type UserUniversityApproveStatus = 'Approved' | 'WaitApprove' | 'Wait' | 'Rejected';

export type UserUniversityDto = {
  user_id: number;
  university_tenant_name: string;
  approve_status: UserUniversityApproveStatus | number;
};

export type UserUniversity = {
  userId: number;
  tenantName: string;
  approveStatus: UserUniversityApproveStatus;
};

function normalizeUserId(userId: string | number): number | null {
  const parsed = Number.parseInt(String(userId), 10);

  if (Number.isNaN(parsed)) {
    return null;
  }

  return parsed;
}

function mapApproveStatus(status: UserUniversityApproveStatus | number): UserUniversityApproveStatus {
  if (typeof status === 'number') {
    return APPROVE_STATUS_NUMBER_MAP[status] ?? 'Wait';
  }

  return status;
}

function mapUserUniversityDto(dto: UserUniversityDto): UserUniversity {
  return {
    userId: dto.user_id,
    tenantName: dto.university_tenant_name,
    approveStatus: mapApproveStatus(dto.approve_status),
  };
}

class UsersApiService {
  getUserById(userId: string | number, signal?: AbortSignal): Promise<SimpleUserDto | null> {
    const normalizedId = normalizeUserId(userId);

    if (normalizedId === null) {
      console.warn('[usersApiService] Provided userId is not a valid number', { userId });
      return Promise.resolve(null);
    }

    const searchParams = new URLSearchParams();
    searchParams.append('UserIds', String(normalizedId));

    return apiGet<ReadonlyArray<SimpleUserDto>>(`/users?${searchParams.toString()}`, {
      signal,
      headers: buildTenantHeaders(),
    }).then((users) => users[0] ?? null);
  }

  getUsersByUniversity(
    universityId?: number,
    signal?: AbortSignal,
  ): Promise<ReadonlyArray<SimpleUserDto>> {
    const headers = buildTenantHeaders(
      universityId !== undefined ? { 'X-Tenant-Id': String(universityId) } : undefined,
    );

    return apiGet<ReadonlyArray<SimpleUserDto>>('/users', {
      signal,
      headers,
    });
  }

  getUsersByIds(userIds: ReadonlyArray<number>, signal?: AbortSignal): Promise<ReadonlyArray<SimpleUserDto>> {
    if (userIds.length === 0) {
      return Promise.resolve([]);
    }

    const searchParams = new URLSearchParams();
    userIds.forEach((id) => {
      searchParams.append('UserIds', String(id));
    });

    return apiGet<ReadonlyArray<SimpleUserDto>>(`/users?${searchParams.toString()}`, {
      signal,
      headers: buildTenantHeaders(),
    });
  }

  async getCurrentUserUniversities(signal?: AbortSignal): Promise<ReadonlyArray<UserUniversity>> {
    const response = await apiGet<ReadonlyArray<UserUniversityDto>>('/users/me', {
      signal,
      baseUrl: getAdminApiBaseUrl(),
    });

    return response.map(mapUserUniversityDto);
  }

  async removeUserFromUniversity(
    userId: number,
    universityId?: number,
    signal?: AbortSignal,
  ): Promise<void> {
    const targetUniversityId = universityId ?? Number.parseInt(getTenantId(), 10);
    await apiRequest<void, undefined>(
      `/users/${userId}/universities/${targetUniversityId}`,
      {
        method: 'DELETE',
        signal,
        headers: buildTenantHeaders(),
      },
    );
  }

  updateUserRole(userId: number, role: UserRole, signal?: AbortSignal): Promise<void> {
    // TODO: Implement when backend API is available
    // For now, this is a placeholder
    console.warn('[usersApiService] updateUserRole is not yet implemented in backend', {
      userId,
      role,
      signalProvided: Boolean(signal),
    });
    return Promise.reject(new Error('Изменение роли пользователя пока не поддерживается'));
  }
}

export const usersApiService = new UsersApiService();


