import { apiGet, apiPost } from '@api/shared/api/api-client';
import { getAdminApiBaseUrl } from '@api/shared/api/config';

export type UniversityDto = {
  id: number;
  name: string;
  tenant_name?: string | null;
  tenantName?: string | null;
};

export type University = {
  id: number;
  name: string;
  tenantName: string;
};

export type CreateUniversityPayload = {
  name: string;
  tenant_name: string;
};

function mapUniversityDto(dto: UniversityDto): University {
  return {
    id: dto.id,
    name: dto.name,
    tenantName: dto.tenant_name ?? dto.tenantName ?? '',
  };
}

class UniversitiesApiService {
  async getUniversities(signal?: AbortSignal): Promise<ReadonlyArray<University>> {
    const response = await apiGet<ReadonlyArray<UniversityDto>>('/universities', {
      signal,
      baseUrl: getAdminApiBaseUrl(),
    });
    return response.map(mapUniversityDto);
  }

  createUniversity(payload: CreateUniversityPayload, signal?: AbortSignal): Promise<void> {
    return apiPost<void, CreateUniversityPayload>(
      '/universities',
      payload,
      { signal, baseUrl: getAdminApiBaseUrl() },
    );
  }
}

export const universitiesApiService = new UniversitiesApiService();


