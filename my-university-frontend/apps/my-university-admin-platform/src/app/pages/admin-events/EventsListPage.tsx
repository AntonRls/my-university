import type { ReactElement } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { CloseIcon, EditIcon, PlusIcon, RefreshIcon, TrashIcon } from '@shared/icons';
import {
  deleteUniversityEvent,
  fetchEventRegistrations,
  fetchUniversityEvents,
  type EventRegistration,
  type EventTag,
  type UniversityEvent,
} from '@api/admin';
import { formatParticipantsStatus } from '@entities/event';

import { PageShell } from '../../../shared/layout/index.ts';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Spinner,
} from '../../../shared/ui/index.ts';

function formatEventTimeRange(event: UniversityEvent): string {
  const start = new Date(event.startDateTime);
  const end = new Date(event.endDateTime);

  const startDate = start.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
  });
  const startTime = start.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const endTime = end.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `${startDate} ${startTime}–${endTime}`;
}

export function EventsListPage(): ReactElement {
  const navigate = useNavigate();
  const [events, setEvents] = useState<ReadonlyArray<UniversityEvent>>([]);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [isEventsLoading, setIsEventsLoading] = useState(true);
  const [isEventsRefreshing, setIsEventsRefreshing] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<number | null>(null);
  const [viewingRegistrationsEventId, setViewingRegistrationsEventId] = useState<number | null>(null);
  const [registrations, setRegistrations] = useState<ReadonlyArray<EventRegistration>>([]);
  const [isRegistrationsLoading, setIsRegistrationsLoading] = useState(false);
  const [registrationsError, setRegistrationsError] = useState<string | null>(null);

  const loadEvents = useCallback(
    async (options?: { silent?: boolean }) => {
      const isSilent = options?.silent === true;

      if (isSilent) {
        setIsEventsRefreshing(true);
      } else {
        setIsEventsLoading(true);
      }

      setEventsError(null);

      try {
        const result = await fetchUniversityEvents();
        setEvents(result);
      } catch (error: unknown) {
        console.error('[admin-events] failed to load events', error);
        setEventsError('Не удалось загрузить список событий');
      } finally {
        if (isSilent) {
          setIsEventsRefreshing(false);
        } else {
          setIsEventsLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const handleDeleteEvent = useCallback(
    async (eventId: number) => {
      setDeletingEventId(eventId);

      try {
        await deleteUniversityEvent(eventId);
        toast.success('Событие удалено');
        await loadEvents({ silent: true });
      } catch (deleteError: unknown) {
        console.error('[admin-events] failed to delete event', deleteError);
        toast.error('Не удалось удалить событие');
      } finally {
        setDeletingEventId(null);
      }
    },
    [loadEvents],
  );

  const handleRefresh = useCallback(() => {
    void loadEvents({ silent: true });
  }, [loadEvents]);

  const handleCreateNew = useCallback(() => {
    navigate('/events/create');
  }, [navigate]);

  const handleEditEvent = useCallback(
    (event: UniversityEvent) => {
      navigate(`/events/${event.id}/edit`);
    },
    [navigate],
  );

  const handleViewRegistrations = useCallback(async (eventId: number) => {
    setViewingRegistrationsEventId(eventId);
    setRegistrationsError(null);
    setIsRegistrationsLoading(true);

    try {
      const result = await fetchEventRegistrations(eventId);
      setRegistrations(result);
    } catch (error: unknown) {
      console.error('[admin-events] failed to load registrations', error);
      setRegistrationsError('Не удалось загрузить список участников');
      toast.error('Не удалось загрузить список участников');
    } finally {
      setIsRegistrationsLoading(false);
    }
  }, []);

  const handleCloseRegistrationsModal = useCallback(() => {
    setViewingRegistrationsEventId(null);
    setRegistrations([]);
    setRegistrationsError(null);
  }, []);

  function formatRegistrationDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function getUserDisplayName(registration: EventRegistration): string {
    const parts: Array<string> = [];
    if (registration.userFirstName) parts.push(registration.userFirstName);
    if (registration.userLastName) parts.push(registration.userLastName);
    if (parts.length === 0 && registration.userUsername) return `@${registration.userUsername}`;
    if (parts.length === 0) return 'Неизвестный пользователь';
    return parts.join(' ');
  }

  const eventsCount = events.length;

  return (
    <PageShell
      title="Управление событиями"
      description="Просматривайте, редактируйте и удаляйте мероприятия университета."
      actions={
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="secondary" isLoading={isEventsRefreshing}>
            <span className="inline-flex items-center gap-2">
              <RefreshIcon size={16} />
              Обновить
            </span>
          </Button>
          <Button onClick={handleCreateNew}>
            <span className="inline-flex items-center gap-2">
              <PlusIcon size={16} />
              Создать событие
            </span>
          </Button>
        </div>
      }
    >
      <Card className="bg-card/60 backdrop-blur">
        <CardHeader className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Список событий</CardTitle>
            <CardDescription>
              {eventsCount === 0 ? 'Нет активных событий' : `${eventsCount} в расписании`}
            </CardDescription>
          </div>
          <Badge variant="outline">{isEventsLoading ? 'Загрузка...' : 'Актуальные данные'}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {eventsError ? (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
              {eventsError}
              <Button
                variant="ghost"
                className="mt-2 px-0 text-destructive-foreground underline"
                onClick={() => {
                  void loadEvents();
                }}
              >
                Повторить попытку
              </Button>
            </div>
          ) : null}

          {isEventsLoading ? (
            <div className="flex items-center gap-3 rounded-xl border border-border/50 px-4 py-3 text-sm text-muted-foreground">
              <Spinner size={20} />
              Загружаем события...
            </div>
          ) : null}

          {!isEventsLoading && events.length === 0 && !eventsError ? (
            <div className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-center">
              <p className="mb-4 text-sm text-muted-foreground">
                Событий пока нет. Добавьте новое мероприятие, чтобы студенты видели его в приложении.
              </p>
              <Button onClick={handleCreateNew}>
                <span className="inline-flex items-center gap-2">
                  <PlusIcon size={16} />
                  Создать первое событие
                </span>
              </Button>
            </div>
          ) : null}

          <div className="flex flex-col gap-4">
            {events.map((event) => {
              return (
                <article
                  key={event.id}
                  className="rounded-2xl border border-border/70 bg-card/40 p-4 shadow-md shadow-black/10 transition hover:border-primary/50"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-lg font-semibold text-foreground">{event.title}</h3>
                    <span className="text-xs uppercase tracking-widest text-primary">
                      {formatEventTimeRange(event)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{event.description}</p>
                  <p className="mt-2 text-sm font-medium text-foreground">{event.location}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatParticipantsStatus(
                      event.registeredParticipantsCount,
                      event.participantsLimit,
                    )}
                  </p>
                  {event.tags.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {event.tags.map((tag: EventTag) => (
                        <Badge key={tag.id} variant="outline">
                          #{tag.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-muted-foreground">Теги не назначены</p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleViewRegistrations(event.id)}
                      disabled={deletingEventId !== null}
                    >
                      Участники ({event.registeredParticipantsCount})
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleEditEvent(event)}
                      disabled={deletingEventId !== null}
                    >
                      <span className="inline-flex items-center gap-2">
                        <EditIcon size={16} />
                        Редактировать
                      </span>
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteEvent(event.id)}
                      isLoading={deletingEventId === event.id}
                      disabled={deletingEventId !== null && deletingEventId !== event.id}
                      aria-label={`Удалить событие ${event.title}`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <TrashIcon size={16} />
                        Удалить
                      </span>
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {viewingRegistrationsEventId !== null ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={handleCloseRegistrationsModal}
        >
          <Card
            className="w-full max-w-2xl bg-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Участники события</CardTitle>
                <CardDescription>
                  Всего зарегистрировано: {registrations.length}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseRegistrationsModal}
                aria-label="Закрыть"
              >
                <CloseIcon size={20} />
              </Button>
            </CardHeader>
            <CardContent className="max-h-[60vh] space-y-4 overflow-y-auto">
              {registrationsError ? (
                <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
                  {registrationsError}
                </div>
              ) : null}

              {isRegistrationsLoading ? (
                <div className="flex items-center gap-3 rounded-xl border border-border/50 px-4 py-3 text-sm text-muted-foreground">
                  <Spinner size={20} />
                  Загружаем участников...
                </div>
              ) : null}

              {!isRegistrationsLoading && registrations.length === 0 && !registrationsError ? (
                <div className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    На это событие пока никто не зарегистрировался.
                  </p>
                </div>
              ) : null}

              {!isRegistrationsLoading && registrations.length > 0 ? (
                <div className="space-y-3">
                  {registrations.map((registration) => (
                    <div
                      key={registration.id}
                      className="rounded-xl border border-border/70 bg-card/40 p-4"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h4 className="font-semibold text-foreground">
                            {getUserDisplayName(registration)}
                          </h4>
                          <div className="mt-1 flex flex-wrap gap-2 text-sm text-muted-foreground">
                            {registration.userUsername ? (
                              <span>@{registration.userUsername}</span>
                            ) : null}
                            {registration.userEmail ? (
                              <span>{registration.userEmail}</span>
                            ) : null}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Зарегистрирован: {formatRegistrationDate(registration.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </PageShell>
  );
}

