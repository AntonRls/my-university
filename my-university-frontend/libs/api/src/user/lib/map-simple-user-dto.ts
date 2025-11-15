import type { SimpleUserDto } from '@api/services/users-api-service';

import type { User } from '../model/user';

export function mapSimpleUserDto(dto: SimpleUserDto): User {
  const universityIds = dto.university_ids ?? [];
  const firstName = (dto.first_name ?? '').trim();
  const lastName = (dto.last_name ?? '').trim();

  return {
    id: String(dto.id),
    firstName,
    lastName,
    username: dto.username ?? null,
    email: dto.email ?? null,
    universityIds: universityIds.map((id) => String(id)),
  };
}


