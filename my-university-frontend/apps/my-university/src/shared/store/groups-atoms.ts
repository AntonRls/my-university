import { atom } from 'jotai';

import type { UserGroup } from '@api/structure';

export const userGroupsAtom = atom<ReadonlyArray<UserGroup>>([]);

export const selectedGroupIdAtom = atom<string | null>(null);


