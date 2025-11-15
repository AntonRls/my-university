import type { ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { RefreshIcon, TrashIcon } from '@shared/icons';
import {
  usersApiService,
  type SimpleUserDto,
  type UserRole,
} from '@api/services/users-api-service';

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

type UserWithRole = SimpleUserDto & {
  role: UserRole | null;
};

function getUserDisplayName(user: SimpleUserDto): string {
  const parts: Array<string> = [];
  if (user.first_name) {
    parts.push(user.first_name);
  }
  if (user.last_name) {
    parts.push(user.last_name);
  }
  if (parts.length === 0) {
    return user.username || user.email || `Пользователь #${user.id}`;
  }
  return parts.join(' ');
}

export function UsersManagementPage(): ReactElement {
  const [users, setUsers] = useState<ReadonlyArray<SimpleUserDto>>([]);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [isUsersLoading, setIsUsersLoading] = useState(true);
  const [isUsersRefreshing, setIsUsersRefreshing] = useState(false);

  const [removingUserId, setRemovingUserId] = useState<number | null>(null);
  const [changingRoleUserId, setChangingRoleUserId] = useState<number | null>(null);

  const loadUsers = useCallback(
    async (options?: { silent?: boolean }) => {
      const isSilent = options?.silent === true;

      if (isSilent) {
        setIsUsersRefreshing(true);
      } else {
        setIsUsersLoading(true);
      }

      setUsersError(null);

      try {
        const result = await usersApiService.getUsersByUniversity();
        setUsers(result);
      } catch (error: unknown) {
        console.error('[admin-users] failed to load users', error);
        setUsersError('Не удалось загрузить список пользователей');
      } finally {
        if (isSilent) {
          setIsUsersRefreshing(false);
        } else {
          setIsUsersLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const handleRemoveUser = useCallback(
    async (userId: number) => {
      // eslint-disable-next-line no-alert
      const confirmRemove = window.confirm(
        'Удалить пользователя из университета? Действие нельзя отменить.',
      );

      if (!confirmRemove) {
        return;
      }

      setRemovingUserId(userId);

      try {
        await usersApiService.removeUserFromUniversity(userId);
        toast.success('Пользователь удален из университета');
        await loadUsers({ silent: true });
      } catch (removeError: unknown) {
        console.error('[admin-users] failed to remove user', removeError);
        toast.error('Не удалось удалить пользователя из университета');
      } finally {
        setRemovingUserId(null);
      }
    },
    [loadUsers],
  );

  const handleChangeRole = useCallback(
    async (userId: number, newRole: UserRole) => {
      setChangingRoleUserId(userId);

      try {
        await usersApiService.updateUserRole(userId, newRole);
        toast.success('Роль пользователя изменена');
        await loadUsers({ silent: true });
      } catch (changeError: unknown) {
        console.error('[admin-users] failed to change user role', changeError);
        if (changeError instanceof Error) {
          toast.error(changeError.message);
        } else {
          toast.error('Не удалось изменить роль пользователя');
        }
      } finally {
        setChangingRoleUserId(null);
      }
    },
    [loadUsers],
  );

  const handleRefresh = useCallback(() => {
    void loadUsers({ silent: true });
  }, [loadUsers]);

  // Group users by role (for now, we'll assume all are students if role is not provided)
  const usersWithRoles = useMemo((): ReadonlyArray<UserWithRole> => {
    return users.map((user) => ({
      ...user,
      role: user.role ?? null,
    }));
  }, [users]);

  const students = useMemo(
    () => usersWithRoles.filter((user) => user.role === 'Student' || user.role === null),
    [usersWithRoles],
  );

  const teachers = useMemo(
    () => usersWithRoles.filter((user) => user.role === 'Teacher'),
    [usersWithRoles],
  );

  const renderUserCard = (user: UserWithRole) => (
    <article
      key={user.id}
      className="rounded-2xl border border-border/70 bg-card/40 px-4 py-3 shadow-md shadow-black/10"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground">{getUserDisplayName(user)}</h3>
          <div className="mt-1 flex flex-wrap gap-2 text-sm text-muted-foreground">
            {user.username ? <span>@{user.username}</span> : null}
            {user.email ? <span>{user.email}</span> : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {user.role ? (
            <Badge variant="outline">{user.role === 'Student' ? 'Студент' : 'Преподаватель'}</Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              Роль не указана
            </Badge>
          )}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {user.role !== 'Teacher' ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleChangeRole(user.id, 'Teacher')}
            disabled={changingRoleUserId !== null || removingUserId !== null}
            isLoading={changingRoleUserId === user.id}
          >
            Сделать преподавателем
          </Button>
        ) : null}
        {user.role !== 'Student' ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleChangeRole(user.id, 'Student')}
            disabled={changingRoleUserId !== null || removingUserId !== null}
            isLoading={changingRoleUserId === user.id}
          >
            Сделать студентом
          </Button>
        ) : null}
        <Button
          variant="destructive"
          size="sm"
          onClick={() => handleRemoveUser(user.id)}
          isLoading={removingUserId === user.id}
          disabled={
            changingRoleUserId !== null || (removingUserId !== null && removingUserId !== user.id)
          }
          aria-label={`Удалить ${getUserDisplayName(user)} из университета`}
        >
          <span className="inline-flex items-center gap-2">
            <TrashIcon size={16} />
            Удалить из университета
          </span>
        </Button>
      </div>
    </article>
  );

  return (
    <PageShell
      title="Управление пользователями"
      description="Просматривайте и управляйте студентами, преподавателями и администраторами университета."
      actions={
        <Button onClick={handleRefresh} variant="secondary" isLoading={isUsersRefreshing}>
          <span className="inline-flex items-center gap-2">
            <RefreshIcon size={16} />
            Обновить
          </span>
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-card/60 backdrop-blur">
          <CardHeader className="gap-1">
            <CardTitle>Студенты</CardTitle>
            <CardDescription>
              {students.length === 0 ? 'Нет студентов' : `${students.length} студентов`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {usersError ? (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
                {usersError}
                <Button
                  variant="ghost"
                  className="mt-2 px-0 text-destructive-foreground underline"
                  onClick={() => {
                    void loadUsers();
                  }}
                >
                  Повторить попытку
                </Button>
              </div>
            ) : null}

            {isUsersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner />
              </div>
            ) : null}

            {!isUsersLoading && students.length === 0 && !usersError ? (
              <div className="rounded-xl border border-dashed border-border/60 px-4 py-6 text-sm text-muted-foreground">
                Студентов пока нет
              </div>
            ) : null}

            {!isUsersLoading && students.length > 0 ? (
              <div className="flex flex-col gap-4">{students.map(renderUserCard)}</div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur">
          <CardHeader className="gap-1">
            <CardTitle>Преподаватели</CardTitle>
            <CardDescription>
              {teachers.length === 0 ? 'Нет преподавателей' : `${teachers.length} преподавателей`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isUsersLoading && teachers.length === 0 && !usersError ? (
              <div className="rounded-xl border border-dashed border-border/60 px-4 py-6 text-sm text-muted-foreground">
                Преподавателей пока нет
              </div>
            ) : null}

            {!isUsersLoading && teachers.length > 0 ? (
              <div className="flex flex-col gap-4">{teachers.map(renderUserCard)}</div>
            ) : null}
          </CardContent>
        </Card>

      </div>
    </PageShell>
  );
}

