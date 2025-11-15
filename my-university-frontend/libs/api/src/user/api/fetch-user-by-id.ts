import { usersApiService } from '@api/services/users-api-service';

import type { User } from '../model/user';
import { mapSimpleUserDto } from '../lib/map-simple-user-dto';

export type FetchUserByIdParams = {
  userId: string | number;
  signal?: AbortSignal;
};

export async function fetchUserById(params: FetchUserByIdParams): Promise<User | null> {
  const { userId, signal } = params;

  const dto = await usersApiService.getUserById(userId, signal);

  if (!dto) {
    return null;
  }

  return mapSimpleUserDto(dto);
}


