import type { ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { RefreshIcon } from '@shared/icons';
import { ApiError } from '@api/shared/api/api-client';
import { fetchIncomingStudentsQueue, updateIncomingStudentStatus } from '@api/admin';
import type { IncomingStudent } from '@api/admin';

import { IncomingStudentsQueueSection } from './IncomingStudentsQueueSection';
import { PageShell } from '../../../shared/layout/index.ts';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../shared/ui/index.ts';

type QueueDecision = 'approve' | 'reject';

export function AdminDashboard(): ReactElement {
  const [queue, setQueue] = useState<IncomingStudent[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingState, setProcessingState] = useState<Partial<Record<number, QueueDecision>>>({});

  const pendingCount = queue?.length ?? 0;
  const hasActiveProcessing = useMemo(
    () => Object.keys(processingState).length > 0,
    [processingState],
  );

  const loadQueue = useCallback(
    async (options?: { signal?: AbortSignal; silent?: boolean }) => {
      const isSilent = options?.silent ?? false;

      if (isSilent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setError(null);

      try {
        const response = await fetchIncomingStudentsQueue({ signal: options?.signal });
        setQueue(response);
        setProcessingState({});
      } catch (fetchError: unknown) {
        if (options?.signal?.aborted) {
          return;
        }

        const message = resolveErrorMessage(fetchError);
        setError(message);

        if (isSilent) {
          toast.error(message);
        }
      } finally {
        if (isSilent) {
          setIsRefreshing(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();

    void loadQueue({ signal: controller.signal });

    return () => {
      controller.abort();
    };
  }, [loadQueue]);

  const handleDecision = useCallback(
    async (studentId: number, decision: QueueDecision) => {
      setProcessingState((prev) => ({ ...prev, [studentId]: decision }));

      try {
        await updateIncomingStudentStatus(
          studentId,
          decision === 'approve' ? 'Approved' : 'Rejected',
        );

        setQueue((prev) => prev?.filter((item) => item.id !== studentId) ?? null);

        const successMessage =
          decision === 'approve' ? 'Заявка успешно одобрена' : 'Заявка отклонена';

        toast.success(successMessage);
      } catch (updateError: unknown) {
        const message = resolveErrorMessage(updateError);

        toast.error(message);
      } finally {
        setProcessingState((prev) => {
          const next = { ...prev };
          delete next[studentId];
          return next;
        });
      }
    },
    [],
  );

  const handleApprove = useCallback(
    (studentId: number) => {
      void handleDecision(studentId, 'approve');
    },
    [handleDecision],
  );

  const handleReject = useCallback(
    (studentId: number) => {
      void handleDecision(studentId, 'reject');
    },
    [handleDecision],
  );

  const handleRefresh = useCallback(() => {
    void loadQueue({ silent: error === null });
  }, [error, loadQueue]);

  const overviewItems = useMemo(
    () => [
      {
        title: 'В очереди',
        value: pendingCount,
        hint: 'Кандидаты ожидают подтверждения роли в университете',
      },
    ],
    [pendingCount],
  );

  return (
    <PageShell
      title="Панель администратора"
      description="Контролируйте очередь на вступление, следите за решениями и обновляйте состояние сервисов."
      actions={
        <Button
          onClick={handleRefresh}
          isLoading={isRefreshing || hasActiveProcessing}
          disabled={hasActiveProcessing}
          variant="secondary"
        >
          <span className="inline-flex items-center gap-2">
          <RefreshIcon size={16} />
          Обновить данные
          </span>
        </Button>
      }
    >
      <section className="grid gap-4 md:grid-cols-3">
        {overviewItems.map((item) => (
          <Card key={item.title} className="bg-card/60 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">{item.title}</CardTitle>
              <p className="text-3xl font-semibold text-foreground">{item.value}</p>
            </CardHeader>
            <CardContent>
              <CardDescription>{item.hint}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="mt-6">
        <Card className="bg-card/60 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-xl">Управление очередью</CardTitle>
            <CardDescription>
              Обрабатывайте запросы пользователей, чтобы предоставлять доступ к сервисам вовремя.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <IncomingStudentsQueueSection
              items={queue}
              isLoading={isLoading}
              isRefreshing={isRefreshing}
              error={error}
              processingState={processingState}
              onRetry={handleRefresh}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

function resolveErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return `Ошибка ${error.status}: не удалось выполнить запрос`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Произошла непредвиденная ошибка';
}

