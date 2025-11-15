import type { ReactElement } from 'react';

import { RefreshIcon, TeamsIcon } from '@shared/icons';
import type { AdminRole, IncomingStudent } from '@api/admin';

import { Avatar, Button, Skeleton } from '../../../shared/ui/index.ts';

type QueueDecision = 'approve' | 'reject';

/* eslint-disable no-unused-vars */
type QueueSectionProps = {
  items: IncomingStudent[] | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  processingState: Partial<Record<number, QueueDecision>>;
  onRetry: () => void;
  onApprove: (studentId: number) => void;
  onReject: (studentId: number) => void;
};
/* eslint-enable no-unused-vars */

const ROLE_LABELS: Record<AdminRole, string> = {
  Student: 'Студент',
  Teacher: 'Преподаватель',
};

export function IncomingStudentsQueueSection({
  items,
  isLoading,
  isRefreshing,
  error,
  processingState,
  onRetry,
  onApprove,
  onReject,
}: QueueSectionProps): ReactElement {
  if (error && !isLoading) {
    return (
      <div className="flex flex-col gap-4 rounded-2xl border border-destructive/40 bg-destructive/10 p-6 shadow-lg shadow-black/20">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-destructive-foreground">
            Не удалось загрузить очередь
          </h3>
          <p className="text-sm text-destructive-foreground/80">
            Проверьте подключение или попробуйте обновить страницу. Данные об ожидании вступления
            необходимы для принятия решений.
          </p>
        </div>
        <Button onClick={onRetry} isLoading={isRefreshing} variant="destructive">
          Повторить запрос
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2" role="status" aria-live="polite">
        {[0, 1, 2, 3].map((item) => (
          <Skeleton key={item} className="h-32 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (items === null || items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/70 px-6 py-10 text-center">
        <div className="inline-flex rounded-full bg-primary/15 p-3 text-primary">
          <TeamsIcon size={20} />
        </div>
        <h3 className="text-lg font-semibold">Очередь пуста</h3>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Как только появятся новые заявки на присоединение к университету, они попадут сюда. Вы
          сможете быстро принять решение и уведомить кандидатов.
        </p>
        <Button onClick={onRetry} isLoading={isRefreshing}>
          <span className="inline-flex items-center gap-2">
            <RefreshIcon size={16} />
          Обновить данные
          </span>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/40 px-4 py-3 shadow-inner shadow-black/10 sm:flex-row sm:items-center sm:justify-between">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <TeamsIcon size={16} /> {items.length} в ожидании
        </span>
        <Button onClick={onRetry} isLoading={isRefreshing} variant="secondary">
          <span className="inline-flex items-center gap-2">
          <RefreshIcon size={16} />
          <span>Обновить</span>
          </span>
        </Button>
      </div>

      <div className="grid gap-4">
        {items.map((item) => {
          const decision = processingState[item.id] ?? null;
          const initials = getInitials(item.firstName, item.lastName);
          const hasUsername = Boolean(item.username);

          return (
            <article
              key={item.id}
              className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card/40 p-4 shadow-lg shadow-black/10 backdrop-blur"
              aria-live="polite"
            >
              <header className="flex items-center gap-4">
                <Avatar size={56} initials={initials} className="border-border/50 bg-secondary/40" />

                <div className="space-y-1">
                  <h4 className="text-base font-semibold">
                    {item.firstName} {item.lastName}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-primary/15 px-3 py-1 text-primary">
                      {ROLE_LABELS[item.role]}
                    </span>
                    {hasUsername && <span>@{item.username}</span>}
                  </div>
                </div>
              </header>

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="secondary"
                  onClick={() => onApprove(item.id)}
                  isLoading={decision === 'approve'}
                  disabled={decision !== null}
                  aria-label={`Одобрить заявку пользователя ${item.firstName} ${item.lastName}`}
                  className="flex-1"
                >
                  Одобрить
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => onReject(item.id)}
                  isLoading={decision === 'reject'}
                  disabled={decision !== null}
                  aria-label={`Отклонить заявку пользователя ${item.firstName} ${item.lastName}`}
                  className="flex-1"
                >
                  Отклонить
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function getInitials(firstName: string, lastName: string): string | null {
  const firstInitial = firstName.trim().charAt(0);
  const lastInitial = lastName.trim().charAt(0);

  const parts = [firstInitial, lastInitial].filter(Boolean);

  if (parts.length === 0) {
    return null;
  }

  return parts.join('').toUpperCase();
}

