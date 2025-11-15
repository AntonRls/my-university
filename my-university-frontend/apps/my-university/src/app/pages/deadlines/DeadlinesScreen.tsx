import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAtom } from 'jotai';
import { Button, IconButton, Spinner } from '@maxhub/max-ui';
import { toast } from 'sonner';

import {
  completeDeadline,
  createDeadline,
  deleteDeadline,
  fetchGroupDeadlines,
  fetchMyDeadlines,
  linkDeadlineToLesson,
  updateDeadline,
  type Deadline,
  type DeadlineAccessScope,
} from '@api/deadline';
import {
  addGroupMember,
  createGroup,
  fetchMyGroups,
  fetchStructureTree,
  type StructureTree,
} from '@api/structure';
import { scheduleApiService } from '@api/services/schedule-api-service';
import { usersApiService, type SimpleUserDto } from '@api/services/users-api-service';
import type { ScheduleEntry } from '@api/schedule';
import { PageTemplate } from '@shared/ui/page-template';
import { BottomSheet } from '@shared/ui/bottom-sheet';
import { RichTextEditor } from '@shared/ui/rich-text-editor';
import { sanitizeHtml } from '@shared/utils/rich-text';
import { useUserId } from '@shared/hooks/use-user';
import { selectedGroupIdAtom, userGroupsAtom } from '@shared/store';
import { EditIcon, TrashIcon, CheckIcon, PlusIcon } from '@shared/icons';

import styles from './DeadlinesScreen.module.scss';

type ActiveTab = 'personal' | 'group';

type DeadlineFormState = {
  title: string;
  descriptionHtml: string;
  dueAt: string;
  accessScope: DeadlineAccessScope;
  scheduleEntryId: string;
};

const INITIAL_FORM_STATE: DeadlineFormState = {
  title: '',
  descriptionHtml: '',
  dueAt: '',
  accessScope: 'GroupMembers',
  scheduleEntryId: '',
};

export function DeadlinesScreen() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('personal');
  const [personalDeadlines, setPersonalDeadlines] = useState<Deadline[]>([]);
  const [groupDeadlines, setGroupDeadlines] = useState<Deadline[]>([]);
  const [isPersonalLoading, setIsPersonalLoading] = useState(true);
  const [isGroupLoading, setIsGroupLoading] = useState(false);
  const [userGroups, setUserGroups] = useAtom(userGroupsAtom);
  const [selectedGroupId, setSelectedGroupId] = useAtom(selectedGroupIdAtom);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState<Deadline | null>(null);
  const [formState, setFormState] = useState<DeadlineFormState>(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [isScheduleLoading, setIsScheduleLoading] = useState(false);
  const userId = useUserId();

  // Group creation state
  const [isGroupSheetOpen, setIsGroupSheetOpen] = useState(false);
  const [structureTree, setStructureTree] = useState<StructureTree | null>(null);
  const [isStructureLoading, setIsStructureLoading] = useState(false);
  const [groupFormState, setGroupFormState] = useState({
    label: '',
  });
  const [groupMembers, setGroupMembers] = useState<ReadonlyArray<SimpleUserDto>>([]);
  const [groupMembersSearchQuery, setGroupMembersSearchQuery] = useState('');
  const [isGroupSubmitting, setIsGroupSubmitting] = useState(false);

  // User invitation state
  const [isInviteSheetOpen, setIsInviteSheetOpen] = useState(false);
  const [inviteGroupId, setInviteGroupId] = useState<number | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState<ReadonlyArray<SimpleUserDto>>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [invitedUserIds, setInvitedUserIds] = useState<ReadonlyArray<number>>([]);
  const [isInviting, setIsInviting] = useState(false);

  const loadPersonalDeadlines = useCallback(async () => {
    setIsPersonalLoading(true);
    try {
      const deadlines = await fetchMyDeadlines({ onlyActive: false });
      setPersonalDeadlines(deadlines);
    } catch (error) {
      console.error('[deadlines] failed to load personal deadlines', error);
      toast.error('Не удалось загрузить ваши дедлайны');
    } finally {
      setIsPersonalLoading(false);
    }
  }, []);


  const loadGroupDeadlines = useCallback(async (groupId: number) => {
    setIsGroupLoading(true);
    try {
      const deadlines = await fetchGroupDeadlines(groupId);
      setGroupDeadlines(deadlines);
    } catch (error) {
      console.error('[deadlines] failed to load group deadlines', error);
      toast.error('Не удалось загрузить дедлайны группы');
    } finally {
      setIsGroupLoading(false);
    }
  }, []);

  const loadGroupSchedule = useCallback(async (groupId: number) => {
    setIsScheduleLoading(true);
    try {
      const entries = await scheduleApiService.getGroupSchedule(groupId);
      setScheduleEntries([...entries]);
    } catch (error) {
      console.error('[deadlines] failed to load schedule', error);
      setScheduleEntries([]);
    } finally {
      setIsScheduleLoading(false);
    }
  }, []);

  async function loadGroups() {
    try {
      const groups = await fetchMyGroups();
      setUserGroups(groups);
    } catch (error) {
      console.error('[deadlines] failed to load groups', error);
    }
  }

  useEffect(() => {
    void loadPersonalDeadlines();
  }, [loadPersonalDeadlines]);

  useEffect(() => {
    if (userGroups.length === 0) {
      void loadGroups();
    }
  }, [userGroups.length]);

  useEffect(() => {
    if (isGroupSheetOpen && !structureTree) {
      const loadStructure = async () => {
        setIsStructureLoading(true);
        try {
          const tree = await fetchStructureTree();
          setStructureTree(tree);
        } catch (error) {
          console.error('[deadlines] failed to load structure', error);
          toast.error('Не удалось загрузить структуру университета');
        } finally {
          setIsStructureLoading(false);
        }
      };
      void loadStructure();
    }
  }, [isGroupSheetOpen, structureTree]);

  const defaultStructure = useMemo(() => {
    if (!structureTree || structureTree.faculties.length === 0) {
      return null;
    }

    const faculty = structureTree.faculties[0];
    if (faculty.programs.length === 0) {
      return null;
    }

    const program = faculty.programs[0];
    if (program.courses.length === 0) {
      return null;
    }

    const course = program.courses[0];

    return {
      facultyId: faculty.id,
      programId: program.id,
      courseId: course.id,
    };
  }, [structureTree]);

  useEffect(() => {
    if ((isInviteSheetOpen || isGroupSheetOpen) && allUsers.length === 0) {
      const loadAllUsers = async () => {
        setIsUsersLoading(true);
        try {
          const users = await usersApiService.getUsersByUniversity();
          setAllUsers(users);
        } catch (error) {
          console.error('[deadlines] failed to load users', error);
          toast.error('Не удалось загрузить список пользователей');
        } finally {
          setIsUsersLoading(false);
        }
      };
      void loadAllUsers();
    }
  }, [isInviteSheetOpen, isGroupSheetOpen, allUsers.length]);

  useEffect(() => {
    if (!selectedGroupId && userGroups.length > 0) {
      setSelectedGroupId(String(userGroups[0].id));
    }
  }, [selectedGroupId, setSelectedGroupId, userGroups]);

  useEffect(() => {
    if (selectedGroupId) {
      void loadGroupDeadlines(Number(selectedGroupId));
    }
  }, [selectedGroupId, loadGroupDeadlines]);

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
  };

  const selectedGroup = useMemo(() => {
    if (!selectedGroupId) {
      return null;
    }

    return userGroups.find((group) => String(group.id) === selectedGroupId) ?? null;
  }, [selectedGroupId, userGroups]);

  const canManageSelectedGroup = selectedGroup?.type === 'CustomUser';

  const handleGroupChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedGroupId(event.target.value);
  };

  const resetForm = () => {
    setEditingDeadline(null);
    setFormState(INITIAL_FORM_STATE);
  };

  const handleOpenCreate = () => {
    if (!selectedGroupId) {
      toast.error('Выберите группу, чтобы создать дедлайн');
      return;
    }

    resetForm();
    setIsSheetOpen(true);
    void loadGroupSchedule(Number(selectedGroupId));
  };

  const handleEdit = (deadline: Deadline) => {
    setEditingDeadline(deadline);
    setFormState({
      title: deadline.title,
      descriptionHtml: deadline.descriptionHtml,
      dueAt: formatDateTimeInput(deadline.dueAt),
      accessScope: deadline.accessScope,
      scheduleEntryId: deadline.scheduleEntryId ? String(deadline.scheduleEntryId) : '',
    });
    setIsSheetOpen(true);
    if (selectedGroupId) {
      void loadGroupSchedule(Number(selectedGroupId));
    }
  };

  const handleCloseSheet = () => {
    setIsSheetOpen(false);
    resetForm();
  };

  const handleFormChange = (field: keyof DeadlineFormState, value: string) => {
    setFormState((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedGroupId) {
      toast.error('Выберите группу');
      return;
    }

    if (!formState.title.trim() || !formState.dueAt) {
      return;
    }

    const groupId = Number(selectedGroupId);
    const scheduleEntryId = formState.scheduleEntryId ? Number(formState.scheduleEntryId) : null;
    const dueAtIso = new Date(formState.dueAt).toISOString();

    setIsSubmitting(true);
    try {
      let deadlineId = editingDeadline?.id ?? null;

      if (editingDeadline) {
        await updateDeadline(editingDeadline.id, {
          title: formState.title.trim(),
          descriptionHtml: formState.descriptionHtml,
          dueAt: dueAtIso,
          accessScope: formState.accessScope,
          scheduleEntryId,
        });
      } else {
        deadlineId = await createDeadline({
          groupId,
          title: formState.title.trim(),
          descriptionHtml: formState.descriptionHtml,
          dueAt: dueAtIso,
          accessScope: formState.accessScope,
          scheduleEntryId,
        });
      }

      if (scheduleEntryId && deadlineId) {
        await linkDeadlineToLesson(deadlineId, scheduleEntryId);
      }

      toast.success(editingDeadline ? 'Дедлайн обновлен' : 'Дедлайн создан');
      handleCloseSheet();
      await Promise.all([loadPersonalDeadlines(), loadGroupDeadlines(groupId)]);
    } catch (error) {
      console.error('[deadlines] failed to submit form', error);
      toast.error('Не удалось сохранить дедлайн');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async (deadlineId: number) => {
    try {
      await completeDeadline(deadlineId);
      toast.success('Отлично! Дедлайн отмечен выполненным');
      await loadPersonalDeadlines();
      if (selectedGroupId) {
        await loadGroupDeadlines(Number(selectedGroupId));
      }
    } catch (error) {
      console.error('[deadlines] failed to complete deadline', error);
      toast.error('Не удалось отметить дедлайн');
    }
  };

  const handleDelete = async (deadlineId: number) => {
    try {
      await deleteDeadline(deadlineId);
      toast.success('Дедлайн удалён');
      await loadPersonalDeadlines();
      if (selectedGroupId) {
        await loadGroupDeadlines(Number(selectedGroupId));
      }
    } catch (error) {
      console.error('[deadlines] failed to delete deadline', error);
      toast.error('Не удалось удалить дедлайн');
    }
  };


  const filteredUsers = useMemo(() => {
    if (!userSearchQuery.trim()) {
      return [];
    }

    const query = userSearchQuery.trim().toLowerCase();
    return allUsers.filter((user) => {
      const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
      const firstName = user.first_name.toLowerCase();
      const lastName = user.last_name.toLowerCase();
      return fullName.includes(query) || firstName.includes(query) || lastName.includes(query);
    });
  }, [allUsers, userSearchQuery]);

  const filteredGroupMembers = useMemo(() => {
    if (!groupMembersSearchQuery.trim()) {
      return [];
    }

    const query = groupMembersSearchQuery.trim().toLowerCase();
    return allUsers.filter((user) => {
      const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
      const firstName = user.first_name.toLowerCase();
      const lastName = user.last_name.toLowerCase();
      return fullName.includes(query) || firstName.includes(query) || lastName.includes(query);
    });
  }, [allUsers, groupMembersSearchQuery]);

  const handleOpenCreateGroup = () => {
    setIsGroupSheetOpen(true);
  };

  const handleCloseGroupSheet = () => {
    setIsGroupSheetOpen(false);
    setGroupFormState({
      label: '',
    });
    setGroupMembers([]);
    setGroupMembersSearchQuery('');
  };

  const handleCreateGroup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!userId) {
      toast.error('Не удалось определить пользователя');
      return;
    }

    if (!groupFormState.label.trim()) {
      toast.error('Введите название группы');
      return;
    }

    if (!defaultStructure) {
      toast.error('Не удалось определить структуру университета');
      return;
    }

    setIsGroupSubmitting(true);
    try {
      const groupId = await createGroup({
        facultyId: defaultStructure.facultyId,
        programId: defaultStructure.programId,
        courseId: defaultStructure.courseId,
        type: 'CustomUser',
        label: groupFormState.label.trim(),
        capacity: 200,
        isPrimaryAllowed: false,
        customMeta: {
          createdByUserId: userId,
          createdByRole: 'Student',
          visibility: 'Private',
          moderationStatus: 'Approved',
        },
      });

      // Добавляем участников в группу
      if (groupMembers.length > 0) {
        await Promise.all(
          groupMembers.map((user) =>
            addGroupMember({
              groupId,
              studentId: user.id,
              membershipType: 'Auxiliary',
            }),
          ),
        );
      }

      toast.success('Группа создана');
      handleCloseGroupSheet();
      await loadGroups();
      setSelectedGroupId(String(groupId));
    } catch (error) {
      console.error('[deadlines] failed to create group', error);
      toast.error('Не удалось создать группу');
    } finally {
      setIsGroupSubmitting(false);
    }
  };

  const handleAddMemberToGroup = (user: SimpleUserDto) => {
    if (!groupMembers.find((m) => m.id === user.id)) {
      setGroupMembers((previous) => [...previous, user]);
      setGroupMembersSearchQuery('');
    }
  };

  const handleRemoveMemberFromGroup = (userId: number) => {
    setGroupMembers((previous) => previous.filter((user) => user.id !== userId));
  };

  const handleOpenInvite = (groupId: number) => {
    setInviteGroupId(groupId);
    setInvitedUserIds([]);
    setUserSearchQuery('');
    setIsInviteSheetOpen(true);
  };

  const handleCloseInviteSheet = () => {
    setIsInviteSheetOpen(false);
    setInviteGroupId(null);
    setInvitedUserIds([]);
    setUserSearchQuery('');
  };

  const handleInviteUser = async (user: SimpleUserDto) => {
    if (!inviteGroupId || invitedUserIds.includes(user.id)) {
      return;
    }

    setIsInviting(true);
    try {
      await addGroupMember({
        groupId: inviteGroupId,
        studentId: user.id,
        membershipType: 'Auxiliary',
      });

      setInvitedUserIds((previous) => [...previous, user.id]);
      toast.success(`${user.first_name} ${user.last_name} приглашён в группу`);
      await loadGroups();
    } catch (error) {
      console.error('[deadlines] failed to invite user', error);
      toast.error('Не удалось пригласить пользователя');
    } finally {
      setIsInviting(false);
    }
  };

  const renderDeadlines = (deadlines: Deadline[], isLoading: boolean) => {
    if (isLoading) {
      return (
        <div className={styles.emptyState}>
          <Spinner size={24} />
        </div>
      );
    }

    if (deadlines.length === 0) {
      return <div className={styles.emptyState}>Пока нет запланированных дедлайнов</div>;
    }

    return (
      <ul className={styles.deadlinesList}>
        {deadlines.map((deadline) => {
          const dueDate = formatReadableDate(deadline.dueAt);
          const preview = sanitizeHtml(deadline.descriptionHtml).slice(0, 140);
          const statusClass = styles.deadlineStatus;

          return (
            <li key={deadline.id} className={styles.deadlineCard}>
              <div className={styles.deadlineHeader}>
                <p className={styles.deadlineTitle}>{deadline.title}</p>
                <span className={statusClass}>{translateStatus(deadline.status)}</span>
              </div>
              <div className={styles.deadlineMeta}>
                <span>До: {dueDate}</span>
                {deadline.completions.length > 0 ? (
                  <span>Выполнили: {deadline.completions.length}</span>
                ) : null}
                {deadline.scheduleEntryId ? <span>Привязан к паре #{deadline.scheduleEntryId}</span> : null}
              </div>
              <p className={styles.infoText}>{preview || 'Описание отсутствует'}</p>
              <div className={styles.actions}>
                <Button
                  type="button"
                  size="small"
                  mode="secondary"
                  appearance="themed"
                  onClick={() => handleComplete(deadline.id)}
                  disabled={deadline.status !== 'Active' || Boolean(deadline.completions.find((item) => item.userId === userId))}
                >
                  <CheckIcon size={16} />
                  Готово
                </Button>
                {canManageSelectedGroup ? (
                  <>
                    <Button type="button" size="small" mode="secondary" onClick={() => handleEdit(deadline)}>
                      <EditIcon size={16} />
                      Редактировать
                    </Button>
                    <IconButton
                      type="button"
                      size="small"
                      mode="secondary"
                      appearance="neutral"
                      aria-label="Удалить дедлайн"
                      onClick={() => handleDelete(deadline.id)}
                    >
                      <TrashIcon size={16} />
                    </IconButton>
                  </>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <PageTemplate
      title={['Дедлайны', 'и задачи']}
      actions={
        <Button type="button" size="medium" onClick={handleOpenCreateGroup}>
          <PlusIcon size={16} />
          Создать группу
        </Button>
      }
    >
      <div className={styles.screen}>
        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tabButton} ${activeTab === 'personal' ? styles.tabButtonActive : ''}`}
            onClick={() => handleTabChange('personal')}
          >
            Личные
          </button>
          <button
            type="button"
            className={`${styles.tabButton} ${activeTab === 'group' ? styles.tabButtonActive : ''}`}
            onClick={() => handleTabChange('group')}
          >
            Группы
          </button>
        </div>

        {activeTab === 'personal' ? (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Мои ближайшие дедлайны</h2>
            {renderDeadlines(personalDeadlines, isPersonalLoading)}
          </section>
        ) : (
          <section className={styles.section}>
            {userGroups.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyStateTitle}>Пока нет групп</span>
              </div>
            ) : (
              <>
                <div className={styles.groupSelector}>
                  <h2 className={styles.sectionTitle}>Дедлайны моих групп</h2>
                  <select
                    className={styles.groupSelect}
                    value={selectedGroupId ?? ''}
                    onChange={handleGroupChange}
                  >
                    {userGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.label}
                      </option>
                    ))}
                  </select>
                  {canManageSelectedGroup ? (
                    <div className={styles.groupActions}>
                      <Button type="button" size="large" onClick={handleOpenCreate}>
                        Добавить дедлайн
                      </Button>
                      {selectedGroupId ? (
                        <Button
                          type="button"
                          size="large"
                          mode="secondary"
                          onClick={() => handleOpenInvite(Number(selectedGroupId))}
                        >
                          Пригласить участников
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                {renderDeadlines(groupDeadlines, isGroupLoading)}
              </>
            )}
          </section>
        )}
      </div>

      <BottomSheet isOpen={isSheetOpen} onClose={handleCloseSheet} title={editingDeadline ? 'Редактирование' : 'Новый дедлайн'}>
        <form className={styles.sheetContent} onSubmit={handleSubmit}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="deadline-title">
              Название
            </label>
            <input
              id="deadline-title"
              className={styles.input}
              type="text"
              required
              maxLength={120}
              value={formState.title}
              onChange={(event) => handleFormChange('title', event.target.value)}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Описание</label>
            <div className={styles.richTextWrapper}>
              <RichTextEditor
                value={formState.descriptionHtml}
                onChange={(value) => handleFormChange('descriptionHtml', value)}
                placeholder="Добавьте детали, ссылки и форматирование"
              />
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="deadline-due">
                Сдать до
              </label>
              <input
                id="deadline-due"
                className={styles.input}
                type="datetime-local"
                required
                value={formState.dueAt}
                onChange={(event) => handleFormChange('dueAt', event.target.value)}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="deadline-access">
                Доступ
              </label>
              <select
                id="deadline-access"
                className={styles.select}
                value={formState.accessScope}
                onChange={(event) => handleFormChange('accessScope', event.target.value as DeadlineFormState['accessScope'])}
              >
                <option value="GroupMembers">Все участники группы</option>
                <option value="TeachersOnly">Только преподаватели</option>
                <option value="Administrators">Только админы</option>
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="deadline-lesson">
                Привязать к паре
              </label>
              <select
                id="deadline-lesson"
                className={styles.select}
                value={formState.scheduleEntryId}
                onChange={(event) => handleFormChange('scheduleEntryId', event.target.value)}
                disabled={isScheduleLoading || scheduleEntries.length === 0}
              >
                <option value="">
                  {isScheduleLoading ? 'Загрузка...' : 'Без привязки'}
                </option>
                {scheduleEntries.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.title} • {formatReadableDate(entry.startsAt)}
                  </option>
                ))}
              </select>
              <p className={styles.infoText}>Дедлайн автоматически закончится за час до начала пары.</p>
            </div>
          </div>

          <Button type="submit" size="large" disabled={isSubmitting}>
            {isSubmitting ? 'Сохраняем…' : 'Сохранить'}
          </Button>
        </form>
      </BottomSheet>

      <BottomSheet isOpen={isGroupSheetOpen} onClose={handleCloseGroupSheet} title="Создать группу">
        <form className={styles.sheetContent} onSubmit={handleCreateGroup}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="group-label">
              Название группы
            </label>
            <input
              id="group-label"
              className={styles.input}
              type="text"
              required
              maxLength={128}
              value={groupFormState.label}
              onChange={(event) => setGroupFormState({ label: event.target.value })}
              placeholder="Например: Команда по UX"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="group-members-search">
              Поиск участников по ФИО
            </label>
            <input
              id="group-members-search"
              className={styles.input}
              type="text"
              value={groupMembersSearchQuery}
              onChange={(event) => setGroupMembersSearchQuery(event.target.value)}
              placeholder="Введите имя или фамилию"
              autoComplete="off"
            />
          </div>

          {filteredGroupMembers.length > 0 ? (
            <ul className={styles.deadlinesList}>
              {filteredGroupMembers.map((user) => {
                const fullName = `${user.first_name} ${user.last_name}`;
                const isAdded = groupMembers.some((m) => m.id === user.id);

                return (
                  <li key={user.id} className={styles.deadlineCard}>
                    <div className={styles.deadlineHeader}>
                      <p className={styles.deadlineTitle}>{fullName}</p>
                      {user.role ? <span className={styles.deadlineStatus}>{user.role}</span> : null}
                    </div>
                    {user.username ? <p className={styles.infoText}>@{user.username}</p> : null}
                    <div className={styles.actions}>
                      <Button
                        type="button"
                        size="small"
                        mode="secondary"
                        onClick={() => handleAddMemberToGroup(user)}
                        disabled={isAdded}
                      >
                        {isAdded ? 'Добавлен' : 'Добавить'}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {groupMembers.length > 0 ? (
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Участники группы</label>
              <ul className={styles.deadlinesList}>
                {groupMembers.map((user) => {
                  const fullName = `${user.first_name} ${user.last_name}`;

                  return (
                    <li key={user.id} className={styles.deadlineCard}>
                      <div className={styles.deadlineHeader}>
                        <p className={styles.deadlineTitle}>{fullName}</p>
                      </div>
                      <div className={styles.actions}>
                        <Button
                          type="button"
                          size="small"
                          mode="secondary"
                          appearance="neutral"
                          onClick={() => handleRemoveMemberFromGroup(user.id)}
                        >
                          Удалить
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          <Button type="submit" size="large" disabled={isGroupSubmitting || isStructureLoading || !groupFormState.label.trim()}>
            {isGroupSubmitting ? 'Создаём…' : 'Создать группу'}
          </Button>
        </form>
      </BottomSheet>

      <BottomSheet isOpen={isInviteSheetOpen} onClose={handleCloseInviteSheet} title="Пригласить участников">
        <div className={styles.sheetContent}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="user-search">
              Поиск по ФИО
            </label>
            <input
              id="user-search"
              className={styles.input}
              type="text"
              value={userSearchQuery}
              onChange={(event) => setUserSearchQuery(event.target.value)}
              placeholder="Введите имя или фамилию"
              autoComplete="off"
            />
          </div>

          {isUsersLoading ? (
            <div className={styles.emptyState}>
              <Spinner size={24} />
            </div>
          ) : filteredUsers.length === 0 && userSearchQuery.trim() ? (
            <div className={styles.emptyState}>Пользователи не найдены</div>
          ) : (
            <ul className={styles.deadlinesList}>
              {filteredUsers.map((user) => {
                const isInvited = invitedUserIds.includes(user.id);
                const fullName = `${user.first_name} ${user.last_name}`;

                return (
                  <li key={user.id} className={styles.deadlineCard}>
                    <div className={styles.deadlineHeader}>
                      <p className={styles.deadlineTitle}>{fullName}</p>
                      {user.role ? <span className={styles.deadlineStatus}>{user.role}</span> : null}
                    </div>
                    {user.username ? (
                      <p className={styles.infoText}>@{user.username}</p>
                    ) : null}
                    <div className={styles.actions}>
                      <Button
                        type="button"
                        size="small"
                        mode="secondary"
                        onClick={() => handleInviteUser(user)}
                        disabled={isInvited || isInviting}
                      >
                        {isInvited ? 'Приглашён' : 'Пригласить'}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </BottomSheet>
    </PageTemplate>
  );
}

function formatReadableDate(value: string): string {
  const date = new Date(value);
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateTimeInput(value: string): string {
  const date = new Date(value);
  const iso = date.toISOString();
  return iso.slice(0, 16);
}

function translateStatus(status: Deadline['status']): string {
  switch (status) {
    case 'Completed':
      return 'Выполнен';
    case 'Cancelled':
      return 'Отменён';
    default:
      return 'Активен';
  }
}

