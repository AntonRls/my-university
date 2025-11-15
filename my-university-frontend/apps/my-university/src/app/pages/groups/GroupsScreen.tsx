import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAtom } from 'jotai';
import { Button, IconButton, Spinner } from '@maxhub/max-ui';
import { toast } from 'sonner';

import {
  addGroupMember,
  createGroup,
  fetchMyGroups,
  fetchStructureTree,
} from '@api/structure';
import type {
  CustomGroupModerationStatus,
  CustomGroupVisibility,
  GroupMembershipType,
  GroupNode,
  StructureTree,
  UserGroup,
} from '@api/structure';
import { usersApiService, type SimpleUserDto } from '@api/services/users-api-service';
import { PageTemplate } from '@shared/ui/page-template';
import { BottomSheet } from '@shared/ui/bottom-sheet';
import { MuSearchInput } from '@shared/ui/input';
import { UserAvatar } from '@shared/ui/user-avatar';
import { cn } from '@shared/utils/className';
import { ChevronRightIcon, CloseIcon, PlusIcon } from '@shared/icons';
import { useUserId } from '@shared/hooks/use-user';
import { userGroupsAtom } from '@shared/store';

import styles from './GroupsScreen.module.scss';

type GroupFormState = {
  facultyId: string;
  programId: string;
  courseId: string;
  label: string;
  capacity: string;
  visibility: CustomGroupVisibility;
  moderationStatus: CustomGroupModerationStatus;
};

const INITIAL_FORM_STATE: GroupFormState = {
  facultyId: '',
  programId: '',
  courseId: '',
  label: '',
  capacity: '10',
  visibility: 'Private',
  moderationStatus: 'Pending',
};

const MEMBERSHIP_LABEL: Record<GroupMembershipType, string> = {
  Primary: 'Основная запись',
  Auxiliary: 'Дополнительная запись',
};

const MIN_SEARCH_LENGTH = 2;

function formatGroupType(type: UserGroup['type']) {
  if (type === 'CustomUser' || type === 'CustomAdmin') {
    return 'Кастомная';
  }

  return 'Основная';
}

function formatVisibility(visibility?: CustomGroupVisibility | null) {
  if (!visibility) {
    return null;
  }

  return visibility === 'Private' ? 'Приватная' : 'Видна всем';
}

function formatModeration(status?: CustomGroupModerationStatus | null) {
  if (!status) {
    return null;
  }

  switch (status) {
    case 'Approved':
      return 'Одобрена';
    case 'Blocked':
      return 'Заблокирована';
    default:
      return 'На модерации';
  }
}

function buildUserInitials(user: SimpleUserDto) {
  const first = user.first_name?.[0];
  const last = user.last_name?.[0];

  if (!first && !last) {
    return null;
  }

  return [first, last].filter(Boolean).join('').toUpperCase();
}

function userMatchesQuery(user: SimpleUserDto, normalizedQuery: string) {
  const fullName = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim().toLowerCase();
  const username = user.username?.toLowerCase() ?? '';

  return fullName.includes(normalizedQuery) || (username.length > 0 && username.includes(normalizedQuery));
}

type MembersCache = Record<number, ReadonlyArray<SimpleUserDto>>;

export function GroupsScreen() {
  const [userGroups, setUserGroups] = useAtom(userGroupsAtom);
  const [isGroupsLoading, setIsGroupsLoading] = useState(true);
  const [structureTree, setStructureTree] = useState<StructureTree | null>(null);
  const [isStructureLoading, setIsStructureLoading] = useState(true);
  const [formState, setFormState] = useState<GroupFormState>(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<ReadonlyArray<SimpleUserDto>>([]);
  const [groupMembersSearch, setGroupMembersSearch] = useState('');
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [allUsers, setAllUsers] = useState<ReadonlyArray<SimpleUserDto>>([]);
  const [membersCache, setMembersCache] = useState<MembersCache>({});
  const [activeGroupId, setActiveGroupId] = useState<number | null>(null);
  const [isMembersSheetOpen, setIsMembersSheetOpen] = useState(false);
  const [isMembersLoading, setIsMembersLoading] = useState(false);
  const [memberInviteQuery, setMemberInviteQuery] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const userId = useUserId();

  const loadGroups = useCallback(async () => {
    setIsGroupsLoading(true);
    try {
      const groups = await fetchMyGroups();
      setUserGroups(groups);
      setError(null);
    } catch (requestError) {
      console.error('[groups] failed to fetch my groups', requestError);
      setError('Не удалось загрузить группы');
    } finally {
      setIsGroupsLoading(false);
    }
  }, [setUserGroups]);

  const loadStructure = useCallback(async () => {
    setIsStructureLoading(true);
    try {
      const tree = await fetchStructureTree();
      setStructureTree(tree);
    } catch (requestError) {
      console.error('[groups] failed to fetch structure', requestError);
      setStructureTree(null);
    } finally {
      setIsStructureLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadGroups();
    void loadStructure();
  }, [loadGroups, loadStructure]);

  const ensureUsersLoaded = useCallback(async () => {
    if (allUsers.length > 0 || isUsersLoading) {
      return;
    }

    setIsUsersLoading(true);
    try {
      const users = await usersApiService.getUsersByUniversity();
      setAllUsers(users);
    } catch (requestError) {
      console.error('[groups] failed to fetch users', requestError);
      toast.error('Не удалось загрузить список студентов');
    } finally {
      setIsUsersLoading(false);
    }
  }, [allUsers.length, isUsersLoading]);

  const faculties = structureTree?.faculties ?? [];

  const groupNodesMap = useMemo(() => {
    const map = new Map<number, GroupNode>();

    faculties.forEach((faculty) => {
      faculty.programs.forEach((program) => {
        program.courses.forEach((course) => {
          course.groups.forEach((group) => {
            map.set(group.id, group);
          });
        });
      });
    });

    return map;
  }, [faculties]);

  const programs = useMemo(() => {
    const faculty = faculties.find((item) => String(item.id) === formState.facultyId);
    return faculty?.programs ?? [];
  }, [faculties, formState.facultyId]);

  const courses = useMemo(() => {
    const program = programs.find((item) => String(item.id) === formState.programId);
    return program?.courses ?? [];
  }, [programs, formState.programId]);

  const defaultStructure = useMemo(() => {
    const firstFaculty = faculties[0];
    if (!firstFaculty) {
      return null;
    }

    const firstProgram = firstFaculty.programs[0];
    if (!firstProgram) {
      return null;
    }

    const firstCourse = firstProgram.courses[0];
    if (!firstCourse) {
      return null;
    }

    return {
      facultyId: String(firstFaculty.id),
      programId: String(firstProgram.id),
      courseId: String(firstCourse.id),
    };
  }, [faculties]);

  useEffect(() => {
    if (!defaultStructure) {
      return;
    }

    setFormState((previous) => {
      if (previous.facultyId && previous.programId && previous.courseId) {
        return previous;
      }

      return {
        ...previous,
        facultyId: previous.facultyId || defaultStructure.facultyId,
        programId: previous.programId || defaultStructure.programId,
        courseId: previous.courseId || defaultStructure.courseId,
      };
    });
  }, [defaultStructure]);

  const isFormValid =
    formState.facultyId.length > 0 &&
    formState.programId.length > 0 &&
    formState.courseId.length > 0 &&
    formState.label.trim().length >= 3 &&
    Number(formState.capacity) > 0;

  const handleFieldChange = (field: keyof GroupFormState, value: string) => {
    setFormState((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleFacultyChange = (value: string) => {
    const faculty = faculties.find((item) => String(item.id) === value);
    const fallbackProgram = faculty?.programs[0];
    const fallbackCourse = fallbackProgram?.courses[0];

    setFormState((previous) => ({
      ...previous,
      facultyId: value,
      programId: fallbackProgram ? String(fallbackProgram.id) : '',
      courseId: fallbackCourse ? String(fallbackCourse.id) : '',
    }));
  };

  const handleProgramChange = (value: string) => {
    const program = programs.find((item) => String(item.id) === value);
    const fallbackCourse = program?.courses[0];

    setFormState((previous) => ({
      ...previous,
      programId: value,
      courseId: fallbackCourse ? String(fallbackCourse.id) : '',
    }));
  };

  const handleReset = () => {
    setFormState((previous) => ({
      ...INITIAL_FORM_STATE,
      facultyId: previous.facultyId,
      programId: previous.programId,
      courseId: previous.courseId,
    }));
    setSelectedMembers([]);
    setGroupMembersSearch('');
  };

  const handleAddSelectedMember = (user: SimpleUserDto) => {
    setSelectedMembers((previous) => {
      if (previous.some((member) => member.id === user.id)) {
        return previous;
      }

      return [...previous, user];
    });
    setGroupMembersSearch('');
  };

  const handleRemoveSelectedMember = (userId: number) => {
    setSelectedMembers((previous) => previous.filter((user) => user.id !== userId));
  };

  const loadGroupMembers = useCallback(
    async (groupId: number) => {
      const groupNode = groupNodesMap.get(groupId);
      if (!groupNode) {
        toast.error('Не удалось найти группу в структуре');
        return;
      }

      if (groupNode.members.length === 0) {
        setMembersCache((previous) => ({
          ...previous,
          [groupId]: [],
        }));
        return;
      }

      setIsMembersLoading(true);
      try {
        const users = await usersApiService.getUsersByIds(groupNode.members.map((member) => member.studentId));
        setMembersCache((previous) => ({
          ...previous,
          [groupId]: users,
        }));
      } catch (requestError) {
        console.error('[groups] failed to load group members', requestError);
        toast.error('Не удалось загрузить список участников');
      } finally {
        setIsMembersLoading(false);
      }
    },
    [groupNodesMap],
  );

  const handleOpenMembersSheet = async (groupId: number) => {
    setActiveGroupId(groupId);
    setIsMembersSheetOpen(true);
    setMemberInviteQuery('');

    if (!membersCache[groupId]) {
      await loadGroupMembers(groupId);
    }
  };

  const handleCloseMembersSheet = () => {
    setIsMembersSheetOpen(false);
    setActiveGroupId(null);
    setMemberInviteQuery('');
  };

  const handleInviteUser = async (user: SimpleUserDto) => {
    if (!activeGroupId || isInviting) {
      return;
    }

    setIsInviting(true);
    try {
      await addGroupMember({
        groupId: activeGroupId,
        studentId: user.id,
        membershipType: 'Auxiliary',
      });

      setMembersCache((previous) => {
        const currentMembers = previous[activeGroupId] ?? [];
        if (currentMembers.some((member) => member.id === user.id)) {
          return previous;
        }

        return {
          ...previous,
          [activeGroupId]: [...currentMembers, user],
        };
      });
      setMemberInviteQuery('');
      toast.success(`${user.first_name} ${user.last_name} добавлен(а) в группу`);
    } catch (requestError) {
      console.error('[groups] failed to invite user', requestError);
      toast.error('Не удалось добавить участника');
    } finally {
      setIsInviting(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isFormValid) {
      return;
    }

    if (!userId) {
      toast.error('Не удалось определить пользователя');
      return;
    }

    setIsSubmitting(true);
    try {
      const createdGroupId = await createGroup({
        facultyId: Number(formState.facultyId),
        programId: Number(formState.programId),
        courseId: Number(formState.courseId),
        type: 'CustomUser',
        label: formState.label.trim(),
        capacity: Number(formState.capacity),
        isPrimaryAllowed: false,
        customMeta: {
          createdByUserId: userId,
          createdByRole: 'Student',
          visibility: formState.visibility,
          moderationStatus: formState.moderationStatus,
        },
      });

      if (selectedMembers.length > 0) {
        await Promise.all(
          selectedMembers.map((member) =>
            addGroupMember({
              groupId: createdGroupId,
              studentId: member.id,
              membershipType: 'Auxiliary',
            }),
          ),
        );
      }

      toast.success('Группа создана');
      handleReset();
      await loadGroups();
    } catch (requestError) {
      console.error('[groups] failed to create custom group', requestError);
      toast.error('Не удалось создать группу');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedGroup = userGroups.find((group) => group.id === activeGroupId) ?? null;
  const selectedGroupMembers = activeGroupId ? membersCache[activeGroupId] ?? [] : [];

  const normalizedNewGroupQuery = groupMembersSearch.trim().toLowerCase();
  const newGroupSearchResults = useMemo(() => {
    if (normalizedNewGroupQuery.length < MIN_SEARCH_LENGTH) {
      return [];
    }

    return allUsers
      .filter((user) => userMatchesQuery(user, normalizedNewGroupQuery))
      .filter((user) => !selectedMembers.some((member) => member.id === user.id))
      .slice(0, 6);
  }, [allUsers, normalizedNewGroupQuery, selectedMembers]);

  const normalizedInviteQuery = memberInviteQuery.trim().toLowerCase();
  const inviteCandidates = useMemo(() => {
    if (!activeGroupId || normalizedInviteQuery.length < MIN_SEARCH_LENGTH) {
      return [];
    }

    const existingIds = new Set(selectedGroupMembers.map((member) => member.id));

    return allUsers
      .filter((user) => !existingIds.has(user.id))
      .filter((user) => userMatchesQuery(user, normalizedInviteQuery))
      .slice(0, 6);
  }, [activeGroupId, allUsers, normalizedInviteQuery, selectedGroupMembers]);

  const renderGroups = () => {
    if (isGroupsLoading) {
      return (
        <div className={styles.emptyState}>
          <Spinner size={24} />
        </div>
      );
    }

    if (error) {
      return <div className={styles.emptyState}>{error}</div>;
    }

    if (userGroups.length === 0) {
      return <div className={styles.emptyState}>Вы ещё не состоите ни в одной группе</div>;
    }

    return (
      <ul className={styles.groupsList}>
        {userGroups.map((group) => {
          const groupNode = groupNodesMap.get(group.id);
          const membersCount = groupNode?.members.length ?? null;
          const visibilityLabel = formatVisibility(group.customMeta?.visibility);
          const moderationLabel = formatModeration(group.customMeta?.moderationStatus);

          return (
            <li key={group.id}>
              <button
                type="button"
                className={styles.groupCard}
                onClick={() => handleOpenMembersSheet(group.id)}
              >
                <div className={styles.groupCardHeader}>
                  <p className={styles.groupLabel}>{group.label}</p>
                  <ChevronRightIcon className={styles.chevronIcon} aria-hidden />
                </div>
                <div className={styles.groupTags}>
                  <span className={styles.tag}>{formatGroupType(group.type)}</span>
                  <span className={styles.tag}>{group.isPrimaryAllowed ? 'Можно основную' : 'Только доп. запись'}</span>
                  {visibilityLabel ? <span className={styles.tag}>{visibilityLabel}</span> : null}
                  {moderationLabel ? (
                    <span
                      className={cn(
                        styles.tag,
                        group.customMeta?.moderationStatus === 'Approved' && styles.tagSuccess,
                        group.customMeta?.moderationStatus === 'Blocked' && styles.tagWarning,
                      )}
                    >
                      {moderationLabel}
                    </span>
                  ) : null}
                </div>
                <p className={styles.groupMeta}>
                  {membersCount !== null ? `Участников: ${membersCount}` : 'Участники: —'}
                </p>
                <p className={styles.groupHint}>Нажмите, чтобы открыть состав и пригласить участников</p>
              </button>
            </li>
          );
        })}
      </ul>
    );
  };

  const renderMemberList = () => {
    if (isMembersLoading) {
      return (
        <div className={styles.sheetPlaceholder}>
          <Spinner size={24} />
        </div>
      );
    }

    if (selectedGroupMembers.length === 0) {
      return <div className={styles.sheetPlaceholder}>Пока никто не присоединился к группе</div>;
    }

    return (
      <ul className={styles.membersList}>
        {selectedGroupMembers.map((member) => (
          <li key={member.id} className={styles.memberItem}>
            <UserAvatar size={44} initials={buildUserInitials(member)} />
            <div className={styles.memberInfo}>
              <span className={styles.memberName}>
                {member.first_name} {member.last_name}
              </span>
              <span className={styles.memberMeta}>{member.username ? `@${member.username}` : 'Без username'}</span>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <PageTemplate title={['Мои', 'группы']}>
      <div className={styles.screen}>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Мои группы</h2>
              <p className={styles.sectionSubtitle}>Открывай карточку, чтобы увидеть состав и пригласить друзей</p>
            </div>
            <Button type="button" size="medium" mode="secondary" appearance="neutral" onClick={() => void loadGroups()}>
              Обновить
            </Button>
          </div>
          {renderGroups()}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Создать кастомную группу</h2>
              <p className={styles.sectionSubtitle}>Просто придумайте название и добавьте участников</p>
            </div>
          </div>
          {isStructureLoading ? (
            <div className={styles.emptyState}>
              <Spinner size={24} />
            </div>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="group-name">
                  Название
                </label>
                <input
                  id="group-name"
                  className={styles.input}
                  type="text"
                  value={formState.label}
                  onChange={(event) => handleFieldChange('label', event.target.value)}
                  placeholder="Например, Команда по дизайну"
                  required
                />
              </div>

              <div className={styles.membersCard}>
                <div className={styles.membersCardHeader}>
                  <div>
                    <p className={styles.membersTitle}>Участники</p>
                    <p className={styles.membersCaption}>Добавьте людей сейчас или сделайте это позже</p>
                  </div>
                  <span className={styles.membersCount}>{selectedMembers.length}</span>
                </div>
                <MuSearchInput
                  type="search"
                  placeholder="Найти по имени или @username"
                  value={groupMembersSearch}
                  onChange={(event) => setGroupMembersSearch(event.target.value)}
                  onFocus={() => {
                    void ensureUsersLoaded();
                  }}
                />
                {isUsersLoading ? (
                  <div className={styles.searchPlaceholder}>
                    <Spinner size={20} />
                  </div>
                ) : newGroupSearchResults.length > 0 ? (
                  <ul className={styles.searchResults}>
                    {newGroupSearchResults.map((user) => (
                      <li key={user.id}>
                        <button
                          type="button"
                          className={styles.searchResult}
                          onClick={() => handleAddSelectedMember(user)}
                        >
                          <UserAvatar size={32} initials={buildUserInitials(user)} />
                          <div className={styles.searchResultInfo}>
                            <span>
                              {user.first_name} {user.last_name}
                            </span>
                            <span className={styles.memberMeta}>{user.username ? `@${user.username}` : '—'}</span>
                          </div>
                          <PlusIcon className={styles.plusIcon} aria-hidden />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : groupMembersSearch.trim().length >= MIN_SEARCH_LENGTH ? (
                  <div className={styles.searchPlaceholder}>Никого не нашли, попробуйте другой запрос</div>
                ) : (
                  <div className={styles.searchPlaceholder}>Введите минимум {MIN_SEARCH_LENGTH} символа</div>
                )}

                {selectedMembers.length > 0 ? (
                  <ul className={styles.selectedMembers}>
                    {selectedMembers.map((member) => (
                      <li key={member.id} className={styles.selectedMember}>
                        <UserAvatar size={36} initials={buildUserInitials(member)} />
                        <div className={styles.selectedMemberInfo}>
                          <span>
                            {member.first_name} {member.last_name}
                          </span>
                          <span className={styles.memberMeta}>{member.username ? `@${member.username}` : '—'}</span>
                        </div>
                        <IconButton
                          type="button"
                          size="small"
                          mode="secondary"
                          appearance="neutral"
                          className={styles.removeButton}
                          onClick={() => handleRemoveSelectedMember(member.id)}
                          aria-label="Убрать участника"
                        >
                          <CloseIcon size={16} />
                        </IconButton>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.membersEmptyHint}>Пока пусто — но вы всегда сможете пригласить людей позже</p>
                )}
              </div>

              <details className={styles.advanced}>
                <summary className={styles.advancedSummary}>Дополнительные настройки</summary>
                <div className={styles.inlineFields}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="faculty-select">
                      Факультет
                    </label>
                    <select
                      id="faculty-select"
                      className={styles.select}
                      value={formState.facultyId}
                      onChange={(event) => handleFacultyChange(event.target.value)}
                      required
                    >
                      <option value="">Выберите факультет</option>
                      {faculties.map((faculty) => (
                        <option key={faculty.id} value={faculty.id}>
                          {faculty.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="program-select">
                      Программа
                    </label>
                    <select
                      id="program-select"
                      className={styles.select}
                      value={formState.programId}
                      onChange={(event) => handleProgramChange(event.target.value)}
                      disabled={programs.length === 0}
                      required
                    >
                      <option value="">Выберите программу</option>
                      {programs.map((program) => (
                        <option key={program.id} value={program.id}>
                          {program.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="course-select">
                      Курс
                    </label>
                    <select
                      id="course-select"
                      className={styles.select}
                      value={formState.courseId}
                      onChange={(event) => handleFieldChange('courseId', event.target.value)}
                      disabled={courses.length === 0}
                      required
                    >
                      <option value="">Выберите курс</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.inlineFields}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="capacity-input">
                      Максимум участников
                    </label>
                    <input
                      id="capacity-input"
                      className={styles.input}
                      type="number"
                      min={2}
                      max={200}
                      value={formState.capacity}
                      onChange={(event) => handleFieldChange('capacity', event.target.value)}
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="visibility-select">
                      Видимость
                    </label>
                    <select
                      id="visibility-select"
                      className={styles.select}
                      value={formState.visibility}
                      onChange={(event) => handleFieldChange('visibility', event.target.value as CustomGroupVisibility)}
                    >
                      <option value="Private">Приватная</option>
                      <option value="Tenant">Видна всем</option>
                    </select>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="moderation-select">
                      Модерация
                    </label>
                    <select
                      id="moderation-select"
                      className={styles.select}
                      value={formState.moderationStatus}
                      onChange={(event) =>
                        handleFieldChange('moderationStatus', event.target.value as CustomGroupModerationStatus)
                      }
                    >
                      <option value="Pending">На модерации</option>
                      <option value="Approved">Одобрена</option>
                    </select>
                  </div>
                </div>
              </details>

              <div className={styles.actions}>
                <Button type="submit" size="large" disabled={!isFormValid || isSubmitting}>
                  {isSubmitting ? 'Создаём…' : 'Создать группу'}
                </Button>
                <Button
                  type="button"
                  size="large"
                  mode="tertiary"
                  appearance="neutral"
                  onClick={handleReset}
                  disabled={isSubmitting}
                >
                  Сбросить
                </Button>
                <p className={styles.helper}>
                  Сначала создайте группу, а потом делитесь с ней расписанием, дедлайнами и проектами.
                </p>
              </div>
            </form>
          )}
        </section>
      </div>

      <BottomSheet
        isOpen={isMembersSheetOpen}
        onClose={handleCloseMembersSheet}
        title={selectedGroup ? selectedGroup.label : 'Состав группы'}
      >
        {selectedGroup ? (
          <div className={styles.sheetContent}>
            <div className={styles.sheetMeta}>
              <div>
                <p className={styles.sheetMetaLabel}>Тип группы</p>
                <p className={styles.sheetMetaValue}>{formatGroupType(selectedGroup.type)}</p>
              </div>
              {selectedGroup.customMeta?.visibility ? (
                <div>
                  <p className={styles.sheetMetaLabel}>Видимость</p>
                  <p className={styles.sheetMetaValue}>{formatVisibility(selectedGroup.customMeta.visibility)}</p>
                </div>
              ) : null}
              <div>
                <p className={styles.sheetMetaLabel}>Участники</p>
                <p className={styles.sheetMetaValue}>
                  {selectedGroupMembers.length}{' '}
                  <span className={styles.sheetMetaHint}>
                    {selectedGroup.isPrimaryAllowed ? MEMBERSHIP_LABEL.Primary : MEMBERSHIP_LABEL.Auxiliary}
                  </span>
                </p>
              </div>
            </div>

            {renderMemberList()}

            <div className={styles.inviteBlock}>
              <p className={styles.membersTitle}>Добавить участников</p>
              <MuSearchInput
                type="search"
                placeholder="Введите имя или @username"
                value={memberInviteQuery}
                onFocus={() => {
                  void ensureUsersLoaded();
                }}
                onChange={(event) => setMemberInviteQuery(event.target.value)}
              />
              {isUsersLoading ? (
                <div className={styles.searchPlaceholder}>
                  <Spinner size={20} />
                </div>
              ) : inviteCandidates.length > 0 ? (
                <ul className={styles.searchResults}>
                  {inviteCandidates.map((user) => (
                    <li key={user.id}>
                      <button
                        type="button"
                        className={styles.searchResult}
                        onClick={() => handleInviteUser(user)}
                        disabled={isInviting}
                      >
                        <UserAvatar size={32} initials={buildUserInitials(user)} />
                        <div className={styles.searchResultInfo}>
                          <span>
                            {user.first_name} {user.last_name}
                          </span>
                          <span className={styles.memberMeta}>{user.username ? `@${user.username}` : '—'}</span>
                        </div>
                        <PlusIcon className={styles.plusIcon} aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : memberInviteQuery.trim().length >= MIN_SEARCH_LENGTH ? (
                <div className={styles.searchPlaceholder}>Не нашлось подходящих людей</div>
              ) : (
                <div className={styles.searchPlaceholder}>Введите минимум {MIN_SEARCH_LENGTH} символа</div>
              )}
            </div>
          </div>
        ) : (
          <div className={styles.sheetPlaceholder}>Выберите группу из списка</div>
        )}
      </BottomSheet>
    </PageTemplate>
  );
}
