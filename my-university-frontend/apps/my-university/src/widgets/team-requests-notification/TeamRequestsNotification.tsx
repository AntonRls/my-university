import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Typography } from '@maxhub/max-ui';

import { useUserId } from '@shared/hooks/use-user';
import { ROUTES } from '@shared/config/routes';

import type { StudentProject } from '@entities/student-project';
import { fetchStudentProjects, mapStudentProjectList } from '@entities/student-project';

import styles from './TeamRequestsNotification.module.scss';

function isAbortError(error: unknown): boolean {
  if (!error) {
    return false;
  }

  if (error instanceof DOMException) {
    return error.name === 'AbortError';
  }

  if (error instanceof Error) {
    return error.name === 'AbortError';
  }

  return false;
}

export function TeamRequestsNotification() {
  const userId = useUserId();
  const navigate = useNavigate();
  const [myProject, setMyProject] = useState<StudentProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadMyProject = useCallback(async () => {
    setIsLoading(true);

    try {
      const result = await fetchStudentProjects();
      const mapped = mapStudentProjectList(result);
      const found = mapped.find((p) => p.ownerId === String(userId ?? ''));
      setMyProject(found ?? null);
    } catch (error) {
      if (isAbortError(error)) {
        return;
      }

      console.error('[team-requests] failed to load project', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadMyProject();
  }, [loadMyProject]);

  const pendingRequests = useMemo(() => {
    if (!myProject) {
      return [];
    }

    return myProject.participants.filter((p) => p.status === 'pending');
  }, [myProject]);

  const handleGoToTeam = useCallback(() => {
    navigate(ROUTES.studentProjects, { state: { openManage: true } });
  }, [navigate]);

  if (isLoading) {
    return null;
  }

  if (!myProject || pendingRequests.length === 0) {
    return null;
  }

  const requestsCount = pendingRequests.length;
  const requestsWord = getRequestsWord(requestsCount);

  return (
    <div className={styles.notification}>
      <div className={styles.content}>
        <Typography.Title className={styles.title}>
          Новые запросы на участие
        </Typography.Title>
        <Typography.Body className={styles.message}>
          У вас {requestsCount} {requestsWord} на участие в вашей команде
        </Typography.Body>
      </div>
      <Button
        type="button"
        size="medium"
        mode="primary"
        appearance="themed"
        className={styles.button}
        onClick={handleGoToTeam}
      >
        Перейти к команде
      </Button>
    </div>
  );
}

function getRequestsWord(count: number): string {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return 'запросов';
  }

  if (lastDigit === 1) {
    return 'запрос';
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'запроса';
  }

  return 'запросов';
}

