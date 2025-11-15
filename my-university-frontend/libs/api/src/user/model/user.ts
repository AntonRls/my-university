export type User = {
  id: string;
  firstName: string;
  lastName: string;
  username: string | null;
  email: string | null;
  universityIds: ReadonlyArray<string>;
};

export function getUserFullName(user: Pick<User, 'firstName' | 'lastName' | 'username'>): string | null {
  const firstName = user.firstName.trim();
  const lastName = user.lastName.trim();
  const fullName = `${firstName} ${lastName}`.trim();

  if (fullName.length > 0) {
    return fullName;
  }

  return user.username ?? null;
}


