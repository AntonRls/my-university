import { useCallback, useEffect, useMemo } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';

import { requestJoinUniversity, type AdminRole } from '@api/admin';
import { universitiesApiService, usersApiService } from '@api/services';
import type { University, UserUniversity } from '@api/services';
import {
  startupAvailableUniversitiesAtom,
  startupErrorAtom,
  startupHasApprovedUniversityAtom,
  startupHasPendingRequestAtom,
  startupIsSubmittingAtom,
  startupIsUniversitiesLoadingAtom,
  startupIsUserUniversitiesLoadingAtom,
  startupSubmissionSuccessAtom,
  startupUserUniversitiesAtom,
} from '@shared/store';

import { useAuth } from './use-auth';

type SubmitJoinRequestPayload = {
  tenantId: string;
  role: AdminRole;
};

type StartupGateState = {
  isAuthorizing: boolean;
  authError: string | null;
  isCheckingMembership: boolean;
  needsUniversitySelection: boolean;
  hasPendingRequest: boolean;
  hasApprovedUniversity: boolean;
  userUniversities: ReadonlyArray<UserUniversity>;
  availableUniversities: ReadonlyArray<University>;
  isUniversitiesLoading: boolean;
  isSubmitting: boolean;
  submissionSuccess: boolean;
  error: string | null;
  refetchMembership: () => Promise<void>;
  submitJoinRequest: (payload: SubmitJoinRequestPayload) => Promise<void>;
};

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}

export function useStartupGate(): StartupGateState {
  const auth = useAuth();

  const userUniversities = useAtomValue(startupUserUniversitiesAtom);
  const availableUniversities = useAtomValue(startupAvailableUniversitiesAtom);
  const isCheckingMembership = useAtomValue(startupIsUserUniversitiesLoadingAtom);
  const isUniversitiesLoading = useAtomValue(startupIsUniversitiesLoadingAtom);
  const error = useAtomValue(startupErrorAtom);
  const isSubmitting = useAtomValue(startupIsSubmittingAtom);
  const submissionSuccess = useAtomValue(startupSubmissionSuccessAtom);
  const hasApprovedUniversity = useAtomValue(startupHasApprovedUniversityAtom);
  const hasPendingRequest = useAtomValue(startupHasPendingRequestAtom);

  const setUserUniversities = useSetAtom(startupUserUniversitiesAtom);
  const setAvailableUniversities = useSetAtom(startupAvailableUniversitiesAtom);
  const setIsCheckingMembership = useSetAtom(startupIsUserUniversitiesLoadingAtom);
  const setIsUniversitiesLoading = useSetAtom(startupIsUniversitiesLoadingAtom);
  const setStartupError = useSetAtom(startupErrorAtom);
  const setIsSubmitting = useSetAtom(startupIsSubmittingAtom);
  const setSubmissionSuccess = useSetAtom(startupSubmissionSuccessAtom);

  const hasOnlyRejectedUniversities = useMemo(() => {
    if (userUniversities.length === 0) {
      return false;
    }

    return userUniversities.every((item) => item.approveStatus === 'Rejected');
  }, [userUniversities]);

  const shouldBootstrap = useMemo(() => {
    if (auth.error) {
      return false;
    }

    return auth.isInitialized && !auth.isLoading;
  }, [auth.error, auth.isInitialized, auth.isLoading]);

  const loadUniversitiesCatalog = useCallback(async () => {
    setStartupError(null);
    setIsUniversitiesLoading(true);

    try {
      const list = await universitiesApiService.getUniversities();
      setAvailableUniversities(list);
    } catch (err) {
      setStartupError(extractErrorMessage(err, 'Не удалось загрузить список ВУЗов'));
    } finally {
      setIsUniversitiesLoading(false);
    }
  }, [setAvailableUniversities, setIsUniversitiesLoading, setStartupError]);

  const refetchMembership = useCallback(async () => {
    setStartupError(null);
    setIsCheckingMembership(true);

    try {
      const memberships = await usersApiService.getCurrentUserUniversities();
      setUserUniversities(memberships);
    } catch (err) {
      setStartupError(extractErrorMessage(err, 'Не удалось загрузить данные пользователя'));
    } finally {
      setIsCheckingMembership(false);
    }
  }, [setIsCheckingMembership, setStartupError, setUserUniversities]);

  const submitJoinRequest = useCallback(
    async ({ tenantId, role }: SubmitJoinRequestPayload) => {
      setStartupError(null);
      setSubmissionSuccess(false);
      setIsSubmitting(true);

      try {
        await requestJoinUniversity(role, tenantId);
        setSubmissionSuccess(true);
        await refetchMembership();
      } catch (err) {
        const message = extractErrorMessage(err, 'Не удалось отправить заявку');
        setStartupError(message);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [refetchMembership, setIsSubmitting, setStartupError, setSubmissionSuccess],
  );

  useEffect(() => {
    if (!shouldBootstrap) {
      return;
    }

    void refetchMembership();
  }, [refetchMembership, shouldBootstrap]);

  useEffect(() => {
    if (!shouldBootstrap || isCheckingMembership) {
      return;
    }

    const needsUniversitiesCatalog = userUniversities.length === 0 || hasOnlyRejectedUniversities;
    if (!needsUniversitiesCatalog || availableUniversities.length > 0) {
      return;
    }

    void loadUniversitiesCatalog();
  }, [
    availableUniversities.length,
    hasOnlyRejectedUniversities,
    isCheckingMembership,
    loadUniversitiesCatalog,
    shouldBootstrap,
    userUniversities.length,
  ]);

  const needsUniversitySelection = useMemo(() => {
    if (isCheckingMembership || auth.error || submissionSuccess) {
      return false;
    }

    if (hasApprovedUniversity || hasPendingRequest) {
      return false;
    }

    if (userUniversities.length === 0 || hasOnlyRejectedUniversities) {
      return true;
    }

    return false;
  }, [
    auth.error,
    hasOnlyRejectedUniversities,
    hasApprovedUniversity,
    hasPendingRequest,
    isCheckingMembership,
    submissionSuccess,
    userUniversities.length,
  ]);

  return {
    isAuthorizing: auth.isLoading || !auth.isInitialized,
    authError: auth.error,
    isCheckingMembership,
    needsUniversitySelection,
    hasPendingRequest,
    hasApprovedUniversity,
    userUniversities,
    availableUniversities,
    isUniversitiesLoading,
    isSubmitting,
    submissionSuccess,
    error,
    refetchMembership,
    submitJoinRequest,
  };
}

export type { StartupGateState };


