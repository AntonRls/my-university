import { apiDelete } from '@api/shared/api/api-client';

export async function removePersonalSlot(entryId: number): Promise<void> {
  await apiDelete<void>(`/schedule/me/slots/${entryId}`);
}

