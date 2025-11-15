import { atom } from 'jotai';

import type {
  University,
  UserUniversity,
  UserUniversityApproveStatus,
} from '@api/services';

export const startupUserUniversitiesAtom = atom<ReadonlyArray<UserUniversity>>([]);

export const startupAvailableUniversitiesAtom = atom<ReadonlyArray<University>>([]);

export const startupIsUserUniversitiesLoadingAtom = atom<boolean>(false);

export const startupIsUniversitiesLoadingAtom = atom<boolean>(false);

export const startupErrorAtom = atom<string | null>(null);

export const startupIsSubmittingAtom = atom<boolean>(false);

export const startupSubmissionSuccessAtom = atom<boolean>(false);

export const startupApproveStatusAtom = atom<ReadonlyArray<UserUniversityApproveStatus>>((get) => {
  return get(startupUserUniversitiesAtom).map((item) => item.approveStatus);
});

export const startupHasApprovedUniversityAtom = atom((get) => {
  return get(startupUserUniversitiesAtom).some((item) => item.approveStatus === 'Approved');
});

export const startupHasPendingRequestAtom = atom((get) => {
  return get(startupUserUniversitiesAtom).some((item) =>
    item.approveStatus === 'Wait' || item.approveStatus === 'WaitApprove',
  );
});


