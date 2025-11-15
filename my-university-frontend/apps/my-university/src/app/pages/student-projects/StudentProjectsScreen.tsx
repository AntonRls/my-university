/// <reference lib="dom" />
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, Spinner, Typography } from '@maxhub/max-ui';
import { toast } from 'sonner';

import { PageTemplate } from '@shared/ui/page-template';
import { BottomSheet } from '@shared/ui/bottom-sheet';
import { MuSearchInput } from '@shared/ui/input';
import { RichTextEditor } from '@shared/ui/rich-text-editor';
import { ErrorState } from '@shared/ui/error-state';
import { cn } from '@shared/utils/className';
import { sanitizeHtml, hasRichTextContent } from '@shared/utils/rich-text';
import { useUserId } from '@shared/hooks/use-user';
import { useAuth } from '@shared/hooks/use-auth';
import { getFullNameFromToken } from '@shared/utils/jwt';
import { ApiError } from '@api/shared/api/api-client';
import { ROUTES, getProjectUrl } from '@shared/config/routes';

import type {
  StudentProject,
  Skill,
  TeamRole,
} from '@entities/student-project';
import {
  ProjectCard,
  fetchStudentProjects,
  fetchSkills,
  fetchTeamRoles,
  createTeamRole,
  createStudentProject,
  updateStudentProject,
  createParticipantRequest,
  approveParticipant,
  rejectParticipant,
  updateParticipantRole,
  removeParticipant,
  mapStudentProjectList,
  mapTeamRoleDto,
} from '@entities/student-project';
import type { UniversityEvent } from '@entities/event';
import type {
  ProjectAction,
  UpdateProjectHandler,
  ParticipantHandler,
  ParticipantRoleHandler,
  SubmitProjectHandler,
  RoleSelectHandler,
} from './StudentProjectsScreen.types';
import { mapUniversityEventList } from '@entities/event';
import { eventsApiService } from '@api/services';
import type { User } from '@api/user';
import { fetchUserById, getUserFullName } from '@api/user';

import styles from './StudentProjectsScreen.module.scss';

function generateTemporaryId(): string {
  return window.crypto.randomUUID();
}

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

function normalizeSearchQuery(value: string): string {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return '';
  }

  return trimmed
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function doesProjectMatchSearch(project: StudentProject, query: string): boolean {
  if (query.length === 0) {
    return true;
  }

  const normalizedQuery = normalizeSearchQuery(query);
  const normalizedTitle = normalizeSearchQuery(project.title);
  const normalizedDescription = project.description
    ? normalizeSearchQuery(project.description)
    : '';
  const normalizedSkills = project.skills.map((skill) => normalizeSearchQuery(skill.name));

  return (
    normalizedTitle.includes(normalizedQuery) ||
    normalizedDescription.includes(normalizedQuery) ||
    normalizedSkills.some((skill) => skill.includes(normalizedQuery))
  );
}

function isUserApprovedParticipant(project: StudentProject, userId: string | null): boolean {
  if (!userId) {
    return false;
  }

  return project.participants.some(
    (participant) => participant.userId === userId && participant.status === 'approved',
  );
}

function formatEventDateRange(event: StudentProject['event']): string | null {
  if (!event) {
    return null;
  }

  const startDate = new Date(event.startDateTime);
  const endDate = event.endDateTime ? new Date(event.endDateTime) : null;

  if (Number.isNaN(startDate.getTime())) {
    return null;
  }

  const startFormatter = new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  if (!endDate || Number.isNaN(endDate.getTime())) {
    return startFormatter.format(startDate);
  }

  const isSameDay = startDate.toDateString() === endDate.toDateString();
  const endFormatter = new Intl.DateTimeFormat('ru-RU', {
    day: isSameDay ? undefined : '2-digit',
    month: isSameDay ? undefined : 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  const startText = startFormatter.format(startDate);
  const endText = endFormatter.format(endDate);

  return `${startText} — ${endText}`;
}

export function StudentProjectsScreen() {
  const userId = useUserId();
  const userIdString = userId !== null && userId !== undefined ? String(userId) : null;
  const location = useLocation();
  const navigate = useNavigate();
  const { id: projectIdFromUrl } = useParams<{ id: string }>();
  const projectsAbortControllerRef = useRef<AbortController | null>(null);
  const userDetailsAbortControllerRef = useRef<AbortController | null>(null);
  const pendingUserFetchIdsRef = useRef<Set<string>>(new Set<string>());
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState<ReadonlyArray<StudentProject> | null>(null);
  const [skills, setSkills] = useState<ReadonlyArray<Skill>>([]);
  const [teamRoles, setTeamRoles] = useState<ReadonlyArray<TeamRole>>([]);
  const [events, setEvents] = useState<ReadonlyArray<UniversityEvent>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);
  const [isManageSheetOpen, setIsManageSheetOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<StudentProject | null>(null);
  const [pendingActionIds, setPendingActionIds] = useState<ReadonlySet<string>>(new Set());
  const [userDetailsCache, setUserDetailsCache] = useState<Record<string, User | null>>({});

  const loadProjects = useCallback(async () => {
    projectsAbortControllerRef.current?.abort();

    const controller = new AbortController();
    projectsAbortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchStudentProjects({ signal: controller.signal });
      const mapped = mapStudentProjectList(result);
      setProjects(mapped);
    } catch (err) {
      if (isAbortError(err)) {
        return;
      }

      console.error('[student-projects] failed to load projects', err);
      setError('Не удалось загрузить проекты');
    } finally {
      if (projectsAbortControllerRef.current === controller) {
        projectsAbortControllerRef.current = null;
      }
      setIsLoading(false);
    }
  }, []);

  const loadSkills = useCallback(async () => {
    try {
      const result = await fetchSkills();
      setSkills(result);
    } catch (err) {
      console.error('[student-projects] failed to load skills', err);
    }
  }, []);

  const loadTeamRoles = useCallback(async () => {
    try {
      const result = await fetchTeamRoles();
      setTeamRoles(result.map(mapTeamRoleDto));
    } catch (err) {
      console.error('[student-projects] failed to load team roles', err);
    }
  }, []);

  const loadEvents = useCallback(async () => {
    try {
      const result = await eventsApiService.getEvents();
      const mapped = mapUniversityEventList(result);
      setEvents(mapped);
    } catch (err) {
      console.error('[student-projects] failed to load events', err);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
    void loadSkills();
    void loadTeamRoles();
    void loadEvents();
  }, [loadProjects, loadSkills, loadTeamRoles, loadEvents]);

  useEffect(() => {
    return () => {
      projectsAbortControllerRef.current?.abort();
      userDetailsAbortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!projects || !selectedProject) {
      return;
    }

    const updatedProject = projects.find((project) => project.id === selectedProject.id);

    if (!updatedProject) {
      return;
    }

    if (updatedProject !== selectedProject) {
      setSelectedProject(updatedProject);
    }
  }, [projects, selectedProject, userDetailsCache]);

  useEffect(() => {
    if (!projects || projects.length === 0) {
      return undefined;
    }

    const missingUserIdsSet = new Set<string>();

    projects.forEach((project) => {
      project.participants.forEach((participant) => {
        if (!participant.userId) {
          return;
        }

        const hasDisplayData = Boolean(participant.userName) || Boolean(participant.userEmail);

        if (hasDisplayData) {
          return;
        }

        if (
          !userDetailsCache[participant.userId] &&
          !pendingUserFetchIdsRef.current.has(participant.userId)
        ) {
          missingUserIdsSet.add(participant.userId);
        }
      });
    });

    if (missingUserIdsSet.size === 0) {
      return undefined;
    }

    userDetailsAbortControllerRef.current?.abort();
    const controller = new AbortController();
    userDetailsAbortControllerRef.current = controller;

    const missingUserIds = Array.from(missingUserIdsSet);
    missingUserIds.forEach((id) => pendingUserFetchIdsRef.current.add(id));

    const loadUsers = async () => {
      try {
        const responses = await Promise.all(
          missingUserIds.map(async (participantUserId) => {
            try {
              const user = await fetchUserById({
                userId: participantUserId,
                signal: controller.signal,
              });
              return { userId: participantUserId, user };
            } catch (err) {
              if (isAbortError(err)) {
                throw err;
              }
              console.error(`[student-projects] failed to load user ${participantUserId}`, err);
              return { userId: participantUserId, user: null };
            }
          }),
        );

        const responsesMap = new Map<string, User | null>(
          responses.map((entry) => [entry.userId, entry.user]),
        );

        setUserDetailsCache((prevCache) => {
          let changed = false;
          const nextCache: Record<string, User | null> = { ...prevCache };

          responsesMap.forEach((user, userIdKey) => {
            if (user && nextCache[userIdKey] !== user) {
              nextCache[userIdKey] = user;
              changed = true;
            } else if (user === null && !(userIdKey in nextCache)) {
              nextCache[userIdKey] = null;
              changed = true;
            }
          });

          return changed ? nextCache : prevCache;
        });

        setProjects((prevProjects) => {
          if (!prevProjects) {
            return prevProjects;
          }

          let projectsChanged = false;

          const updatedProjects = prevProjects.map((project) => {
            let participantsChanged = false;

            const updatedParticipants = project.participants.map((participant) => {
              const fetchedUser = responsesMap.get(participant.userId);

              if (!fetchedUser) {
                return participant;
              }

              const nextName = getUserFullName(fetchedUser);
              const nextEmail = fetchedUser.email;

              const shouldUpdateName = nextName !== null && nextName !== participant.userName;
              const shouldUpdateEmail = nextEmail !== null && nextEmail !== participant.userEmail;

              if (!shouldUpdateName && !shouldUpdateEmail) {
                return participant;
              }

              participantsChanged = true;

              return {
                ...participant,
                userName: shouldUpdateName && nextName ? nextName : participant.userName,
                userEmail: shouldUpdateEmail && nextEmail ? nextEmail : participant.userEmail,
              };
            });

            if (participantsChanged) {
              projectsChanged = true;
              return {
                ...project,
                participants: updatedParticipants,
              };
            }

            return project;
          });

          return projectsChanged ? updatedProjects : prevProjects;
        });
      } catch (err) {
        if (!isAbortError(err)) {
          console.error('[student-projects] failed to enrich participants with user data', err);
        }
      } finally {
        missingUserIds.forEach((id) => pendingUserFetchIdsRef.current.delete(id));
        if (userDetailsAbortControllerRef.current === controller) {
          userDetailsAbortControllerRef.current = null;
        }
      }
    };

    void loadUsers();

    return () => {
      controller.abort();
      missingUserIds.forEach((id) => pendingUserFetchIdsRef.current.delete(id));
    };
  }, [projects, userDetailsCache]);

  const myProjects = useMemo(() => {
    if (!projects || !userIdString) {
      return [];
    }

    return projects.filter(
      (project) => project.ownerId === userIdString || isUserApprovedParticipant(project, userIdString),
    );
  }, [projects, userIdString]);

  const myProjectIds = useMemo(() => new Set(myProjects.map((project) => project.id)), [myProjects]);

  const otherProjects = useMemo(() => {
    if (!projects) {
      return [];
    }

    if (!userIdString) {
      return projects;
    }

    return projects.filter((project) => !myProjectIds.has(project.id));
  }, [projects, userIdString, myProjectIds]);

  const filteredOtherProjects = useMemo(
    () => otherProjects.filter((p) => doesProjectMatchSearch(p, searchQuery)),
    [otherProjects, searchQuery],
  );

  useEffect(() => {
    const shouldOpenManage = (location.state as { openManage?: boolean } | null)?.openManage;

    if (shouldOpenManage && !isLoading && userIdString) {
      const ownProject = myProjects.find((project) => project.ownerId === userIdString);

      if (ownProject) {
        setSelectedProject(ownProject);
        setIsManageSheetOpen(true);
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location.state, location.pathname, myProjects, isLoading, navigate, userIdString]);

  useEffect(() => {
    if (projectIdFromUrl && projects !== null && !isLoading) {
      const project = projects.find((p) => p.id === projectIdFromUrl);
      if (project) {
        setSelectedProject(project);
        setIsDetailsSheetOpen(true);
      } else {
        navigate(ROUTES.studentProjects, { replace: true });
      }
    } else if (!projectIdFromUrl && isDetailsSheetOpen) {
      setIsDetailsSheetOpen(false);
      if (!isManageSheetOpen) {
        setSelectedProject(null);
      }
    }
  }, [projectIdFromUrl, projects, isLoading, isDetailsSheetOpen, isManageSheetOpen, navigate]);

  const handleRetry = useCallback(() => {
    void loadProjects();
  }, [loadProjects]);

  const handleCreateProject = useCallback(
    async (
      title: string,
      description: string,
      existingSkills: ReadonlyArray<Skill>,
      newSkills: ReadonlyArray<{ id: string; name: string }>,
      eventId: string | null,
    ) => {
      setPendingActionIds((prev) => new Set([...prev, 'create']));

      try {
        await createStudentProject({
          title,
          description: description || null,
          existingSkills: existingSkills.length > 0 ? existingSkills : undefined,
          newSkills: newSkills.length > 0 ? newSkills : undefined,
          eventId: eventId || null,
        });
        toast.success('Проект создан');
        setIsCreateSheetOpen(false);
        void loadProjects();
        void loadSkills();
      } catch (err) {
        console.error('[student-projects] failed to create project', err);
        let message = 'Не удалось создать проект';

        if (err instanceof ApiError) {
          if (err.status === 400) {
            message = 'Проверьте правильность данных';
          }
        }

        toast.error(message);
      } finally {
        setPendingActionIds((prev) => {
          const next = new Set(prev);
          next.delete('create');
          return next;
        });
      }
    },
    [loadProjects, loadSkills],
  );


  const handleUpdateProject = useCallback(
    async (
      projectId: string,
      title: string,
      description: string,
      existingSkills: ReadonlyArray<Skill>,
      newSkills: ReadonlyArray<{ id: string; name: string }>,
    ) => {
      setPendingActionIds((prev) => new Set([...prev, `update-${projectId}`]));

      try {
        await updateStudentProject({
          projectId,
          title,
          description: description || null,
          existingSkills: existingSkills.length > 0 ? existingSkills : undefined,
          newSkills: newSkills.length > 0 ? newSkills : undefined,
        });
        toast.success('Проект обновлен');
        setIsManageSheetOpen(false);
        setSelectedProject(null);
        void loadProjects();
        void loadSkills();
      } catch (err) {
        console.error('[student-projects] failed to update project', err);
        let message = 'Не удалось обновить проект';

        if (err instanceof ApiError) {
          if (err.status === 400) {
            message = 'Проверьте правильность данных';
          } else if (err.status === 404) {
            message = 'Проект не найден';
          }
        }

        toast.error(message);
      } finally {
        setPendingActionIds((prev) => {
          const next = new Set(prev);
          next.delete(`update-${projectId}`);
          return next;
        });
      }
    },
    [loadProjects, loadSkills],
  );

  const handleRequestJoin = useCallback(
    async (project: StudentProject) => {
      if (project.ownerId === (userIdString ?? '')) {
        toast.error('Вы не можете подать заявку в свой проект');
        return;
      }

      const isParticipant = userIdString
        ? project.participants.some((p) => p.userId === userIdString)
        : false;

      if (isParticipant) {
        toast.error('Вы уже являетесь участником этого проекта');
        return;
      }

      setPendingActionIds((prev) => new Set([...prev, `request-${project.id}`]));

      try {
        await createParticipantRequest({
          projectId: project.id,
        });
        toast.success('Заявка отправлена');
        void loadProjects();
      } catch (err) {
        console.error('[student-projects] failed to create request', err);
        let message = 'Не удалось отправить заявку';

        if (err instanceof ApiError) {
          if (err.status === 400) {
            message = 'Вы уже подали заявку на этот проект';
          } else if (err.status === 404) {
            message = 'Проект не найден';
          }
        }

        toast.error(message);
      } finally {
        setPendingActionIds((prev) => {
          const next = new Set(prev);
          next.delete(`request-${project.id}`);
          return next;
        });
      }
    },
    [loadProjects, userIdString],
  );

  const handleProjectClick = useCallback(
    (project: StudentProject) => {
      navigate(getProjectUrl(project.id));
    },
    [navigate],
  );

  const handleManage = useCallback((project: StudentProject) => {
    setSelectedProject(project);
    setIsManageSheetOpen(true);
  }, []);

  const handleCloseDetails = useCallback(() => {
    navigate(ROUTES.studentProjects, { replace: true });
  }, [navigate]);

  const handleApproveParticipant = useCallback(
    async (projectId: string, participantId: string) => {
      setPendingActionIds((prev) => new Set([...prev, `approve-${participantId}`]));

      try {
        await approveParticipant({ projectId, participantId });
        toast.success('Участник одобрен');
        void loadProjects();
      } catch (err) {
        console.error('[student-projects] failed to approve participant', err);
        toast.error('Не удалось одобрить участника');
      } finally {
        setPendingActionIds((prev) => {
          const next = new Set(prev);
          next.delete(`approve-${participantId}`);
          return next;
        });
      }
    },
    [loadProjects],
  );

  const handleRejectParticipant = useCallback(
    async (projectId: string, participantId: string) => {
      setPendingActionIds((prev) => new Set([...prev, `reject-${participantId}`]));

      try {
        await rejectParticipant({ projectId, participantId });
        toast.success('Заявка отклонена');
        void loadProjects();
      } catch (err) {
        console.error('[student-projects] failed to reject participant', err);
        toast.error('Не удалось отклонить заявку');
      } finally {
        setPendingActionIds((prev) => {
          const next = new Set(prev);
          next.delete(`reject-${participantId}`);
          return next;
        });
      }
    },
    [loadProjects],
  );

  const handleRemoveParticipant = useCallback(
    async (projectId: string, participantId: string) => {
      setPendingActionIds((prev) => new Set([...prev, `remove-${participantId}`]));

      try {
        await removeParticipant({ projectId, participantId });
        toast.success('Участник удален');
        void loadProjects();
      } catch (err) {
        console.error('[student-projects] failed to remove participant', err);
        toast.error('Не удалось удалить участника');
      } finally {
        setPendingActionIds((prev) => {
          const next = new Set(prev);
          next.delete(`remove-${participantId}`);
          return next;
        });
      }
    },
    [loadProjects],
  );

  const handleLoadUser = useCallback(async (userId: string) => {
    if (userDetailsCache[userId] !== undefined || pendingUserFetchIdsRef.current.has(userId)) {
      return;
    }

    pendingUserFetchIdsRef.current.add(userId);

    try {
      const user = await fetchUserById({ userId });
      setUserDetailsCache((prevCache) => {
        if (prevCache[userId] !== undefined) {
          return prevCache;
        }
        return { ...prevCache, [userId]: user };
      });
    } catch (err) {
      if (isAbortError(err)) {
        return;
      }
      console.error(`[student-projects] failed to load user ${userId}`, err);
      setUserDetailsCache((prevCache) => {
        if (prevCache[userId] !== undefined) {
          return prevCache;
        }
        return { ...prevCache, [userId]: null };
      });
    } finally {
      pendingUserFetchIdsRef.current.delete(userId);
    }
  }, [userDetailsCache]);

  const handleUpdateParticipantRole = useCallback(
    async (projectId: string, participantId: string, roleIdOrName: string) => {
      setPendingActionIds((prev) => new Set([...prev, `update-role-${participantId}`]));

      try {
        // Сначала проверяем, является ли значение ID существующей роли
        let existingRole = teamRoles.find((role) => role.id === roleIdOrName);
        
        // Если не найдено по ID, ищем по имени (регистронезависимо)
        if (!existingRole) {
          existingRole = teamRoles.find(
            (role) => role.name.toLowerCase() === roleIdOrName.toLowerCase().trim(),
          );
        }
        
        let finalRoleId: string;
        
        if (existingRole) {
          // Роль уже существует, используем её ID
          finalRoleId = existingRole.id;
        } else {
          // Роль не найдена, создаём новую
          const newRole = await createTeamRole({ name: roleIdOrName.trim() });
          finalRoleId = newRole.id;
          // Обновляем список ролей
          setTeamRoles((prev) => [...prev, mapTeamRoleDto(newRole)]);
        }

            await updateParticipantRole({
              projectId,
              participantId,
              roleIds: [finalRoleId],
            });
        toast.success('Роль обновлена');
        void loadProjects();
      } catch (err) {
        console.error('[student-projects] failed to update participant role', err);
        toast.error('Не удалось обновить роль');
      } finally {
        setPendingActionIds((prev) => {
          const next = new Set(prev);
          next.delete(`update-role-${participantId}`);
          return next;
        });
      }
    },
    [loadProjects, teamRoles],
  );

  const isCreateProcessing = pendingActionIds.has('create');
  const isManageProcessing = selectedProject
    ? pendingActionIds.has(`update-${selectedProject.id}`)
    : false;
  const shouldShowErrorState = Boolean(error) && !isLoading;

  return (
    <>
      <PageTemplate
        title={['Подбор', 'команд']}
        actions={
          <Button
            type="button"
            size="medium"
            mode="primary"
            appearance="themed"
            onClick={() => setIsCreateSheetOpen(true)}
            disabled={isCreateProcessing}
            aria-busy={isCreateProcessing}
          >
            Создать команду
          </Button>
        }
        contentClassName={styles.content}
      >
        {shouldShowErrorState ? (
          <ErrorState
            title="Не удалось загрузить проекты"
            message="Попробуйте позже, мы уже разбираемся с проблемой."
            onRetry={handleRetry}
          />
        ) : (
          <>
            <MuSearchInput
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Поиск по названию, описанию, навыкам"
              autoComplete="off"
              aria-label="Поиск по проектам"
              aria-busy={isLoading}
              className={styles.searchInput}
            />

            {isLoading ? (
              <div className={styles.loader} role="status" aria-live="polite">
                <Spinner size={30} className={styles.loaderSpinner} />
              </div>
            ) : null}

            {myProjects.length > 0 ? (
              <section className={styles.section}>
                <Typography.Title className={styles.sectionTitle}>Моя команда</Typography.Title>
                <ul className={styles.projectsList}>
                  {myProjects.map((project) => (
                    <li key={project.id}>
                      <ProjectCard
                        project={project}
                        isOwnProject={project.ownerId === (userIdString ?? '')}
                        isApprovedParticipant={isUserApprovedParticipant(project, userIdString)}
                        onManage={handleManage}
                        onClick={handleProjectClick}
                        isProcessing={selectedProject?.id === project.id && isManageProcessing}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className={styles.section}>
              <Typography.Title className={styles.sectionTitle}>
                {myProjects.length > 0 ? 'Другие команды' : 'Команды'}
              </Typography.Title>
              {filteredOtherProjects.length > 0 ? (
                <ul className={styles.projectsList}>
                  {filteredOtherProjects.map((project) => {
                    const isRequestProcessing = pendingActionIds.has(`request-${project.id}`);

                    return (
                      <li key={project.id}>
                        <ProjectCard
                          project={project}
                          isApprovedParticipant={isUserApprovedParticipant(project, userIdString)}
                          onRequestJoin={handleRequestJoin}
                          onClick={handleProjectClick}
                          isProcessing={isRequestProcessing}
                        />
                      </li>
                    );
                  })}
                </ul>
              ) : projects !== null && !isLoading ? (
                <div className={styles.emptyState}>
                  <Typography.Body className={styles.emptyStateText}>
                    {searchQuery.length > 0
                      ? 'Проекты не найдены. Попробуйте изменить запрос.'
                      : 'Пока нет доступных проектов.'}
                  </Typography.Body>
                </div>
              ) : null}
            </section>
          </>
        )}
      </PageTemplate>

      <CreateProjectSheet
        isOpen={isCreateSheetOpen}
        onClose={() => setIsCreateSheetOpen(false)}
        onSubmit={handleCreateProject}
        skills={skills}
        events={events}
        isProcessing={isCreateProcessing}
      />

      {selectedProject ? (
        <>
          <ProjectDetailsSheet
            isOpen={isDetailsSheetOpen}
            onClose={handleCloseDetails}
            project={selectedProject}
            userId={userIdString}
            onManage={handleManage}
            onRequestJoin={handleRequestJoin}
            isRequestProcessing={pendingActionIds.has(`request-${selectedProject.id}`)}
            skills={skills}
            teamRoles={teamRoles}
            onUpdate={handleUpdateProject}
            onApproveParticipant={handleApproveParticipant}
            onRejectParticipant={handleRejectParticipant}
            pendingActionIds={pendingActionIds}
            isUpdateProcessing={isManageProcessing}
            userDetailsCache={userDetailsCache}
            onLoadUser={handleLoadUser}
          />
          <ManageProjectSheet
            isOpen={isManageSheetOpen}
            onClose={() => {
              setIsManageSheetOpen(false);
              setSelectedProject(null);
            }}
            project={selectedProject}
            skills={skills}
            teamRoles={teamRoles}
            onUpdate={handleUpdateProject}
            onApproveParticipant={handleApproveParticipant}
            onRejectParticipant={handleRejectParticipant}
            onRemoveParticipant={handleRemoveParticipant}
            onUpdateParticipantRole={handleUpdateParticipantRole}
            pendingActionIds={pendingActionIds}
            isProcessing={isManageProcessing}
            userDetailsCache={userDetailsCache}
            onLoadUser={handleLoadUser}
          />
        </>
      ) : null}
    </>
  );
}

type ProjectDetailsSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  project: StudentProject;
  userId: string | null;
  onManage: ProjectAction;
  onRequestJoin: ProjectAction;
  isRequestProcessing: boolean;
  skills?: ReadonlyArray<Skill>;
  teamRoles?: ReadonlyArray<TeamRole>;
  onUpdate?: UpdateProjectHandler;
  onApproveParticipant?: ParticipantHandler;
  onRejectParticipant?: ParticipantHandler;
  pendingActionIds?: ReadonlySet<string>;
  isUpdateProcessing?: boolean;
  userDetailsCache?: Record<string, User | null>;
  onLoadUser?: (userId: string) => Promise<void>;
};

// Компонент для выбора роли с поиском и возможностью создания новой
function RoleSelector({
  participantId,
  currentRoleName,
  teamRoles,
  onSelect,
  disabled,
}: {
  participantId: string;
  currentRoleName: string | null;
  teamRoles: ReadonlyArray<TeamRole>;
  onSelect: RoleSelectHandler;
  disabled: boolean;
}) {
  const [searchValue, setSearchValue] = useState(currentRoleName || '');
  const [isFocused, setIsFocused] = useState(false);
  const inputId = `role-selector-${participantId}`;
  const datalistId = `role-datalist-${participantId}`;

  // Обновляем значение при изменении currentRoleName (только если не в фокусе)
  const displayValue = isFocused ? searchValue : (currentRoleName || '');

  // Фильтруем роли по поисковому запросу
  const filteredRoles = useMemo(() => {
    const query = searchValue.toLowerCase().trim();
    if (!query) {
      return teamRoles;
    }
    return teamRoles.filter((role) => role.name.toLowerCase().includes(query));
  }, [searchValue, teamRoles]);

  // Проверяем, есть ли точное совпадение
  const exactMatch = useMemo(() => {
    if (!searchValue.trim()) {
      return null;
    }
    const query = searchValue.trim();
    return teamRoles.find((role) => role.name.toLowerCase() === query.toLowerCase());
  }, [searchValue, teamRoles]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && searchValue.trim()) {
        e.preventDefault();
        // Если есть точное совпадение, используем его, иначе создаём новую роль
        const roleToUse = exactMatch?.id || searchValue.trim();
        onSelect(roleToUse);
        setIsFocused(false);
      } else if (e.key === 'Escape') {
        setIsFocused(false);
      }
    },
    [searchValue, exactMatch, onSelect],
  );

  const handleBlur = useCallback(() => {
    // Небольшая задержка, чтобы onClick на option успел сработать
    setTimeout(() => {
      setIsFocused(false);
    }, 200);
  }, []);

  const handleOptionClick = useCallback(
    (roleId: string) => {
      onSelect(roleId);
      setIsFocused(false);
    },
    [onSelect],
  );

  return (
    <div className={styles.roleSelectorWrapper}>
      <input
        id={inputId}
        type="text"
        list={datalistId}
        value={displayValue}
        onChange={(e) => {
          const { value } = e.target;
          setSearchValue(value);
          setIsFocused(true);
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="Выберите или введите роль"
        className={styles.roleSelect}
        disabled={disabled}
        autoComplete="off"
      />
      <datalist id={datalistId}>
        {filteredRoles.map((role) => (
          <option key={role.id} value={role.name} data-role-id={role.id} />
        ))}
      </datalist>
      {isFocused && (filteredRoles.length > 0 || searchValue.trim()) && (
        <div className={styles.roleDropdown}>
          {filteredRoles.map((role) => (
            <button
              key={role.id}
              type="button"
              className={styles.roleOption}
              onClick={() => handleOptionClick(role.id)}
              disabled={disabled}
            >
              {role.name}
            </button>
          ))}
          {!exactMatch && searchValue.trim() && (
            <button
              type="button"
              className={cn(styles.roleOption, styles.roleOptionNew)}
              onClick={() => {
                onSelect(searchValue.trim());
                setIsFocused(false);
              }}
              disabled={disabled}
            >
              + Создать &quot;{searchValue.trim()}&quot;
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ProjectDetailsSheet({
  isOpen,
  onClose,
  project,
  userId,
  onManage,
  onRequestJoin,
  isRequestProcessing,
  skills = [],
  onUpdate,
  onApproveParticipant,
  onRejectParticipant,
  pendingActionIds = new Set(),
  isUpdateProcessing = false,
  userDetailsCache = {},
  onLoadUser,
}: ProjectDetailsSheetProps) {
  const navigate = useNavigate();
  const isOwner = project.ownerId === String(userId ?? '');
  const { token } = useAuth();
  
  const isParticipant = userId
    ? project.participants.some((p) => p.userId === String(userId))
    : false;
  const canRequestJoin = !isOwner && !isParticipant;
  const approvedParticipants = project.participants.filter((p) => p.status === 'approved');
  const pendingParticipants = project.participants.filter((p) => p.status === 'pending');

  // Функция для получения отображаемого имени участника
  const getParticipantDisplayName = useCallback((participant: { userId: string; userName: string | null; userEmail: string | null }) => {
    const isCurrentUser = userId !== null && participant.userId === String(userId);
    
    if (isCurrentUser) {
      const fullName = getFullNameFromToken(token);
      if (fullName) {
        return `(я) ${fullName}`;
      }
    }
    
    // Если есть имя или email, используем их
    if (participant.userName || participant.userEmail) {
      return participant.userName || participant.userEmail || 'Неизвестный';
    }
    
    // Если имени нет, проверяем кэш
    const cachedUser = userDetailsCache[participant.userId];
    if (cachedUser) {
      const fullName = getUserFullName(cachedUser);
      if (fullName) {
        return fullName;
      }
      if (cachedUser.email) {
        return cachedUser.email;
      }
    }
    
    // Если пользователя нет в кэше, загружаем его
    if (onLoadUser && cachedUser === undefined) {
      void onLoadUser(participant.userId);
    }
    
    return 'Неизвестный';
  }, [userId, token, userDetailsCache, onLoadUser]);
  const hasSkills = project.skills.length > 0;
  const hasDescription = hasRichTextContent(project.description);
  const hasEvent = Boolean(project.event);
  const sanitizedProjectDescription = useMemo(
    () => sanitizeHtml(project.description ?? ''),
    [project.description],
  );

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description || '');
  const [selectedSkillIds, setSelectedSkillIds] = useState<ReadonlySet<string>>(
    new Set(project.skills.map((s) => s.id)),
  );
  const shouldShowPendingRequestsInEdit =
    isOwner &&
    isEditing &&
    pendingParticipants.length > 0 &&
    Boolean(onApproveParticipant && onRejectParticipant);

  useEffect(() => {
    if (isOpen && !isEditing) {
      setTitle(project.title);
      setDescription(project.description || '');
      setSelectedSkillIds(new Set(project.skills.map((s) => s.id)));
    }
  }, [isOpen, isEditing, project]);

  const hasChanges = useMemo(() => {
    return (
      title.trim() !== project.title ||
      (description || '') !== (project.description || '') ||
      Array.from(selectedSkillIds).sort().join(',') !==
        project.skills
          .map((s) => s.id)
          .sort()
          .join(',')
    );
  }, [title, description, selectedSkillIds, project]);

  const handleManageClick = useCallback(() => {
    onClose();
    onManage(project);
  }, [onClose, onManage, project]);

  const handleRequestJoinClick = useCallback(() => {
    onRequestJoin(project);
  }, [onRequestJoin, project]);

  const handleEventClick = useCallback(() => {
    if (project.event) {
      navigate(ROUTES.events);
      onClose();
    }
  }, [navigate, project.event, onClose]);


  const handleCancelEdit = useCallback(() => {
    if (hasChanges) {
      // eslint-disable-next-line no-alert
      const confirmed = window.confirm('Вы уверены, что хотите отменить? Все несохраненные изменения будут потеряны.');
      if (!confirmed) {
        return;
      }
    }
    setIsEditing(false);
    setTitle(project.title);
    setDescription(project.description || '');
    setSelectedSkillIds(new Set(project.skills.map((s) => s.id)));
  }, [hasChanges, project]);

  const handleSaveEdit = useCallback(() => {
    if (!title.trim()) {
      toast.error('Введите название проекта');
      return;
    }

    if (onUpdate) {
      const existingSkills = skills.filter((skill) => selectedSkillIds.has(skill.id));
      onUpdate(project.id, title.trim(), description.trim(), existingSkills, []);
      setIsEditing(false);
    }
  }, [title, description, selectedSkillIds, project.id, onUpdate]);

  const handleToggleSkill = useCallback((skillId: string) => {
    setSelectedSkillIds((prev) => {
      const next = new Set(prev);
      if (next.has(skillId)) {
        next.delete(skillId);
      } else {
        next.add(skillId);
      }
      return next;
    });
  }, []);

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={project.title}
      contentClassName={styles.sheetContent}
    >
      <div className={styles.manageContent}>
        {isOwner && isEditing ? (
          <section className={styles.manageSection}>
            <Typography.Title className={styles.manageSectionTitle}>Редактирование проекта</Typography.Title>
            <div className={styles.form}>
              <div className={styles.formField}>
                <label htmlFor="edit-project-title-details" className={styles.label}>
                  Название проекта *
                </label>
                <input
                  id="edit-project-title-details"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Введите название"
                  className={styles.input}
                  disabled={isUpdateProcessing}
                />
              </div>

              <div className={styles.formField}>
                <label htmlFor="edit-project-description-details" className={styles.label}>
                  Описание
                </label>
                <RichTextEditor
                  id="edit-project-description-details"
                  value={description}
                  onChange={setDescription}
                  placeholder="Опишите ваш проект"
                  disabled={isUpdateProcessing}
                />
              </div>

              {skills.length > 0 ? (
                <div className={styles.formField}>
                  <label className={styles.label}>Навыки</label>
                  <div className={styles.skillsGrid}>
                    {skills.map((skill) => {
                      const isSelected = selectedSkillIds.has(skill.id);

                      return (
                        <button
                          key={skill.id}
                          type="button"
                          className={cn(styles.skillChip, isSelected && styles.skillChipSelected)}
                          onClick={() => handleToggleSkill(skill.id)}
                          disabled={isUpdateProcessing}
                        >
                          {skill.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {shouldShowPendingRequestsInEdit ? (
                <div className={styles.formField}>
                  <Typography.Title className={styles.manageSectionTitle}>
                    Заявки на участие ({pendingParticipants.length})
                  </Typography.Title>
                  <ul className={styles.participantsList}>
                    {pendingParticipants.map((participant) => {
                      const isParticipantProcessing = pendingActionIds.has(`approve-${participant.id}`) ||
                        pendingActionIds.has(`reject-${participant.id}`);

                      return (
                        <li key={participant.id} className={styles.participantItem}>
                          <div className={styles.participantInfo}>
                            <Typography.Body className={styles.participantName}>
                              {getParticipantDisplayName(participant)}
                            </Typography.Body>
                            {participant.userEmail ? (
                              <Typography.Body className={styles.participantEmail}>
                                {participant.userEmail}
                              </Typography.Body>
                            ) : null}
                          </div>
                          <div className={styles.participantActions}>
                            <Button
                              type="button"
                              size="small"
                              mode="primary"
                              appearance="themed"
                              onClick={() => onApproveParticipant?.(project.id, participant.id)}
                              disabled={isParticipantProcessing}
                              aria-busy={isParticipantProcessing}
                            >
                              Одобрить
                            </Button>
                            <Button
                              type="button"
                              size="small"
                              mode="secondary"
                              appearance="neutral"
                              onClick={() => onRejectParticipant?.(project.id, participant.id)}
                              disabled={isParticipantProcessing}
                              aria-busy={isParticipantProcessing}
                            >
                              Отклонить
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}

              <div className={styles.formActions}>
                <Button
                  type="button"
                  size="medium"
                  mode="secondary"
                  appearance="neutral"
                  onClick={handleCancelEdit}
                  disabled={isUpdateProcessing}
                >
                  Отмена
                </Button>
                <Button
                  type="button"
                  size="medium"
                  mode="primary"
                  appearance="themed"
                  onClick={handleSaveEdit}
                  disabled={isUpdateProcessing || !title.trim()}
                  aria-busy={isUpdateProcessing}
                >
                  Сохранить
                </Button>
              </div>
            </div>
          </section>
        ) : (
          <>
            {hasDescription ? (
              <section className={styles.manageSection}>
                <div className={styles.sectionHeader}>
                  <Typography.Title className={styles.manageSectionTitle}>Описание</Typography.Title>
                </div>
                <div
                  className={cn(styles.description, styles.formattedDescription)}
                  dangerouslySetInnerHTML={{ __html: sanitizedProjectDescription }}
                />
              </section>
            ) : isOwner ? (
              <section className={styles.manageSection}>
                <div className={styles.sectionHeader}>
                  <Typography.Title className={styles.manageSectionTitle}>Описание</Typography.Title>
                </div>
              </section>
            ) : null}
          </>
        )}

        {hasEvent ? (
          <section className={styles.manageSection}>
            <Typography.Title className={styles.manageSectionTitle}>Связанное событие</Typography.Title>
            <button
              type="button"
              className={styles.eventLink}
              onClick={handleEventClick}
              aria-label={`Перейти к событию: ${project.event?.title}`}
            >
              <div className={styles.eventLinkContent}>
                <Typography.Body className={styles.eventLinkTitle}>{project.event?.title}</Typography.Body>
                {project.event?.startDateTime ? (
                  <Typography.Body className={styles.eventLinkDate}>
                    {new Date(project.event.startDateTime).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Typography.Body>
                ) : null}
              </div>
              <span className={styles.eventLinkArrow}>→</span>
            </button>
          </section>
        ) : null}

        {project.ownerName ? (
          <section className={styles.manageSection}>
            <Typography.Title className={styles.manageSectionTitle}>Создатель</Typography.Title>
            <Typography.Body>{project.ownerName}</Typography.Body>
          </section>
        ) : null}

        {pendingParticipants.length > 0 && isOwner ? (
          <section className={styles.manageSection}>
            <Typography.Title className={styles.manageSectionTitle}>
              Заявки на участие ({pendingParticipants.length})
            </Typography.Title>
            <ul className={styles.participantsList}>
              {pendingParticipants.map((participant) => {
                const isParticipantProcessing = pendingActionIds.has(`approve-${participant.id}`) ||
                  pendingActionIds.has(`reject-${participant.id}`);

                return (
                  <li key={participant.id} className={styles.participantItem}>
                    <div className={styles.participantInfo}>
                      <Typography.Body className={styles.participantName}>
                        {getParticipantDisplayName(participant)}
                      </Typography.Body>
                      {participant.userEmail ? (
                        <Typography.Body className={styles.participantEmail}>
                          {participant.userEmail}
                        </Typography.Body>
                      ) : null}
                    </div>
                    {onApproveParticipant && onRejectParticipant ? (
                      <div className={styles.participantActions}>
                        <Button
                          type="button"
                          size="small"
                          mode="primary"
                          appearance="themed"
                          onClick={() => onApproveParticipant(project.id, participant.id)}
                          disabled={isParticipantProcessing}
                          aria-busy={isParticipantProcessing}
                        >
                          Одобрить
                        </Button>
                        <Button
                          type="button"
                          size="small"
                          mode="secondary"
                          appearance="neutral"
                          onClick={() => onRejectParticipant(project.id, participant.id)}
                          disabled={isParticipantProcessing}
                          aria-busy={isParticipantProcessing}
                        >
                          Отклонить
                        </Button>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        <section className={styles.manageSection}>
          <Typography.Title className={styles.manageSectionTitle}>
            Участники
            {isOwner && pendingParticipants.length > 0
              ? ` (${approvedParticipants.length} одобрено, ${pendingParticipants.length} заявок)`
              : ` (${approvedParticipants.length})`}
          </Typography.Title>
          {approvedParticipants.length > 0 ? (
            <ul className={styles.participantsList}>
              {approvedParticipants.map((participant) => {
                return (
                  <li key={participant.id} className={styles.participantItem}>
                    <div className={styles.participantInfo}>
                      <Typography.Body className={styles.participantName}>
                        {getParticipantDisplayName(participant)}
                      </Typography.Body>
                      {participant.userEmail && participant.userName ? (
                        <Typography.Body className={styles.participantEmail}>
                          {participant.userEmail}
                        </Typography.Body>
                      ) : null}
                      {participant.roleName ? (
                        <Typography.Body className={styles.participantRole}>
                          Роль: {participant.roleName}
                        </Typography.Body>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Typography.Body className={styles.emptyStateText}>
              Пока нет одобренных участников
            </Typography.Body>
          )}
        </section>

        {hasSkills || (isOwner && !isEditing) ? (
          <section className={styles.manageSection}>
            <div className={styles.sectionHeader}>
              <Typography.Title className={styles.manageSectionTitle}>Навыки</Typography.Title>
              {null}
            </div>
            {hasSkills ? (
              <div className={styles.skillsGrid}>
                {project.skills.map((skill) => (
                  <span key={skill.id} className={styles.skillChip}>
                    #{skill.name}
                  </span>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        {isOwner && !isEditing ? (
          <div className={styles.formActions}>
            <Button
              type="button"
              size="medium"
              mode="primary"
              appearance="themed"
              className={styles.manageButton}
              onClick={handleManageClick}
            >
              Расширенное управление
            </Button>
          </div>
        ) : canRequestJoin ? (
          <div className={styles.formActions}>
            <Button
              type="button"
              size="medium"
              mode="primary"
              appearance="themed"
              onClick={handleRequestJoinClick}
              disabled={isRequestProcessing}
              aria-busy={isRequestProcessing}
            >
              Подать заявку
            </Button>
          </div>
        ) : (
          <div className={styles.formActions}>
            <Button
              type="button"
              size="medium"
              mode="secondary"
              appearance="neutral"
              onClick={onClose}
            >
              Посмотреть
            </Button>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}

type CreateProjectSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: SubmitProjectHandler;
  skills: ReadonlyArray<Skill>;
  events: ReadonlyArray<UniversityEvent>;
  isProcessing: boolean;
};

function CreateProjectSheet({
  isOpen,
  onClose,
  onSubmit,
  skills,
  events,
  isProcessing,
}: CreateProjectSheetProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSkillIds, setSelectedSkillIds] = useState<ReadonlySet<string>>(new Set());
  const [localSkills, setLocalSkills] = useState<ReadonlyArray<Skill>>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const eventSearchInputRef = useRef<HTMLInputElement>(null);

  const resetCreateProjectForm = useCallback(() => {
    setTitle('');
    setDescription('');
    setSelectedSkillIds(new Set());
    setLocalSkills([]);
    setSelectedEventId(null);
    setEventSearchQuery('');
    setIsEventDropdownOpen(false);
    setNewSkillName('');
  }, []);

  useEffect(() => {
    if (!isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      resetCreateProjectForm();
    }
  }, [isOpen, resetCreateProjectForm]);

  const filteredEvents = useMemo(() => {
    if (eventSearchQuery.trim().length === 0) {
      return events;
    }

    const query = eventSearchQuery.trim().toLowerCase();
    return events.filter(
      (event) =>
        event.title.toLowerCase().includes(query) ||
        (event.description && event.description.toLowerCase().includes(query)),
    );
  }, [events, eventSearchQuery]);

  const selectedEvent = useMemo(() => {
    if (!selectedEventId) {
      return null;
    }

    return events.find((e) => e.id === selectedEventId) ?? null;
  }, [events, selectedEventId]);

  const hasFormData = useMemo(() => {
    return title.trim().length > 0 || description.trim().length > 0 || selectedSkillIds.size > 0 || localSkills.length > 0 || selectedEventId !== null;
  }, [title, description, selectedSkillIds, localSkills, selectedEventId]);

  const handleCancel = useCallback(() => {
    if (hasFormData) {
      // eslint-disable-next-line no-alert
      const confirmed = window.confirm('Вы уверены, что хотите отменить? Все введенные данные будут потеряны.');
      if (!confirmed) {
        return;
      }
    }
    onClose();
  }, [hasFormData, onClose]);

  const handleSubmit = useCallback(() => {
    if (!title.trim()) {
      toast.error('Введите название проекта');
      return;
    }

    const existingSkills = skills.filter((skill) => selectedSkillIds.has(skill.id));
    const newSkills = localSkills.filter((skill) => selectedSkillIds.has(skill.id));

    onSubmit(title.trim(), description.trim(), existingSkills, newSkills, selectedEventId);
  }, [title, description, selectedSkillIds, skills, localSkills, selectedEventId, onSubmit]);

  const handleCreateSkill = useCallback(() => {
    if (!newSkillName.trim()) {
      toast.error('Введите название навыка');
      return;
    }

    const trimmedName = newSkillName.trim();
    const existingSkill = skills.find((s) => s.name.toLowerCase() === trimmedName.toLowerCase());
    const existingLocalSkill = localSkills.find((s) => s.name.toLowerCase() === trimmedName.toLowerCase());

    if (existingSkill) {
      setSelectedSkillIds((prev) => new Set([...prev, existingSkill.id]));
      setNewSkillName('');
      toast.success('Навык добавлен');
      return;
    }

    if (existingLocalSkill) {
      setSelectedSkillIds((prev) => new Set([...prev, existingLocalSkill.id]));
      setNewSkillName('');
      toast.success('Навык добавлен');
      return;
    }

    const newSkill: Skill = {
      id: generateTemporaryId(),
      name: trimmedName,
    };

    setLocalSkills((prev) => [...prev, newSkill]);
    setSelectedSkillIds((prev) => new Set([...prev, newSkill.id]));
    setNewSkillName('');
    toast.success('Навык добавлен');
  }, [newSkillName, skills, localSkills]);

  const handleEventSelect = useCallback((eventId: string) => {
    setSelectedEventId(eventId);
    setIsEventDropdownOpen(false);
    setEventSearchQuery('');
  }, []);

  const handleEventSearchFocus = useCallback(() => {
    setIsEventDropdownOpen(true);
  }, []);

  const handleEventSearchBlur = useCallback(() => {
    setTimeout(() => {
      setIsEventDropdownOpen(false);
    }, 200);
  }, []);

  const allSkills = useMemo(() => {
    return [...skills, ...localSkills];
  }, [skills, localSkills]);

  const handleToggleSkill = useCallback((skillId: string) => {
    setSelectedSkillIds((prev) => {
      const next = new Set(prev);
      if (next.has(skillId)) {
        next.delete(skillId);
      } else {
        next.add(skillId);
      }
      return next;
    });
  }, []);

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Создать команду"
      contentClassName={styles.sheetContent}
    >
      <div className={styles.form}>
        <div className={styles.formField}>
          <label htmlFor="project-title" className={styles.label}>
            Название проекта *
          </label>
          <input
            id="project-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Введите название"
            className={styles.input}
            disabled={isProcessing}
          />
        </div>

        <div className={styles.formField}>
          <label htmlFor="project-description" className={styles.label}>
            Описание
          </label>
          <textarea
            id="project-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Опишите ваш проект"
            rows={4}
            className={styles.textarea}
            disabled={isProcessing}
          />
        </div>

        <div className={styles.formField}>
          <label htmlFor="project-event" className={styles.label}>
            Событие (необязательно)
          </label>
          <div className={styles.eventSearchWrapper}>
            <input
              ref={eventSearchInputRef}
              id="project-event"
              type="text"
              value={selectedEvent ? selectedEvent.title : eventSearchQuery}
              onChange={(e) => setEventSearchQuery(e.target.value)}
              onFocus={handleEventSearchFocus}
              onBlur={handleEventSearchBlur}
              placeholder="Поиск события..."
              className={styles.input}
              disabled={isProcessing}
            />
            {selectedEvent ? (
              <button
                type="button"
                className={styles.clearEventButton}
                onClick={() => {
                  setSelectedEventId(null);
                  setEventSearchQuery('');
                }}
                disabled={isProcessing}
                aria-label="Очистить выбор события"
              >
                ×
              </button>
            ) : null}
            {isEventDropdownOpen && filteredEvents.length > 0 ? (
              <div className={styles.eventDropdown}>
                {filteredEvents.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    className={styles.eventOption}
                    onClick={() => handleEventSelect(event.id)}
                  >
                    <span className={styles.eventOptionTitle}>{event.title}</span>
                    {event.description ? (
                      <span className={styles.eventOptionDescription}>{event.description}</span>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className={styles.formField}>
          <label className={styles.label}>Навыки</label>
          <div className={styles.createSkillWrapper}>
            <input
              type="text"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              placeholder="Создать новый навык"
              className={styles.input}
              disabled={isProcessing}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCreateSkill();
                }
              }}
            />
            <Button
              type="button"
              size="small"
              mode="primary"
              appearance="themed"
              onClick={handleCreateSkill}
              disabled={isProcessing || !newSkillName.trim()}
            >
              Добавить
            </Button>
          </div>
          {allSkills.length > 0 ? (
            <div className={styles.skillsGrid}>
              {allSkills.map((skill) => {
                const isSelected = selectedSkillIds.has(skill.id);

                return (
                  <button
                    key={skill.id}
                    type="button"
                    className={cn(styles.skillChip, isSelected && styles.skillChipSelected)}
                    onClick={() => handleToggleSkill(skill.id)}
                    disabled={isProcessing}
                  >
                    {skill.name}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className={styles.formActions}>
          <Button
            type="button"
            size="medium"
            mode="secondary"
            appearance="neutral"
            onClick={handleCancel}
            disabled={isProcessing}
          >
            Отмена
          </Button>
          <Button
            type="button"
            size="medium"
            mode="primary"
            appearance="themed"
            onClick={handleSubmit}
            disabled={isProcessing || !title.trim()}
            aria-busy={isProcessing}
          >
            Создать
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}

type ManageProjectSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  project: StudentProject;
  skills: ReadonlyArray<Skill>;
  teamRoles: ReadonlyArray<TeamRole>;
  onUpdate: UpdateProjectHandler;
  onApproveParticipant: ParticipantHandler;
  onRejectParticipant: ParticipantHandler;
  onRemoveParticipant: ParticipantHandler;
  onUpdateParticipantRole: ParticipantRoleHandler;
  pendingActionIds: ReadonlySet<string>;
  isProcessing: boolean;
  userDetailsCache?: Record<string, User | null>;
  onLoadUser?: (userId: string) => Promise<void>;
};

function ManageProjectSheet({
  isOpen,
  onClose,
  project,
  skills,
  teamRoles,
  onUpdate,
  onApproveParticipant,
  onRejectParticipant,
  onRemoveParticipant,
  onUpdateParticipantRole,
  pendingActionIds,
  isProcessing,
  userDetailsCache = {},
  onLoadUser,
}: ManageProjectSheetProps) {
  const userId = useUserId();
  const { token } = useAuth();
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description || '');
  const [selectedSkillIds, setSelectedSkillIds] = useState<ReadonlySet<string>>(
    new Set(project.skills.map((s) => s.id)),
  );
  const [localSkills, setLocalSkills] = useState<ReadonlyArray<Skill>>([]);

  const syncProjectForm = useCallback(() => {
    setTitle(project.title);
    setDescription(project.description || '');
    setSelectedSkillIds(new Set(project.skills.map((s) => s.id)));
    setLocalSkills([]);
  }, [project]);

  useEffect(() => {
    if (isOpen) {
      syncProjectForm();
    }
  }, [isOpen, syncProjectForm]);

  const hasChanges = useMemo(() => {
    const currentSkillIds = Array.from(selectedSkillIds).sort().join(',');
    const projectSkillIds = project.skills.map((s) => s.id).sort().join(',');
    const hasLocalSkills = localSkills.length > 0;
    
    return (
      title.trim() !== project.title ||
      (description || '') !== (project.description || '') ||
      currentSkillIds !== projectSkillIds ||
      hasLocalSkills
    );
  }, [title, description, selectedSkillIds, localSkills, project]);

  const handleCancel = useCallback(() => {
    if (hasChanges) {
      // eslint-disable-next-line no-alert
      const confirmed = window.confirm('Вы уверены, что хотите отменить? Все несохраненные изменения будут потеряны.');
      if (!confirmed) {
        return;
      }
    }
    onClose();
  }, [hasChanges, onClose]);

  const handleSubmit = useCallback(() => {
    if (!title.trim()) {
      toast.error('Введите название проекта');
      return;
    }

    const existingSkills = skills.filter((skill) => selectedSkillIds.has(skill.id));
    const newSkills = localSkills.filter((skill) => selectedSkillIds.has(skill.id));

    onUpdate(project.id, title.trim(), description.trim(), existingSkills, newSkills);
  }, [title, description, selectedSkillIds, skills, localSkills, project.id, onUpdate]);

  const pendingParticipants = project.participants.filter((p) => p.status === 'pending');
  const approvedParticipants = project.participants.filter((p) => p.status === 'approved');
  const eventDateRange = useMemo(() => formatEventDateRange(project.event), [project.event]);
  const projectLink = useMemo(() => {
    if (typeof window === 'undefined') {
      return getProjectUrl(project.id);
    }
    return `${window.location.origin}${getProjectUrl(project.id)}`;
  }, [project.id]);
  const summaryHints = useMemo(() => {
    const hints: Array<{ text: string; priority: 'high' | 'medium' | 'low' }> = [];

    if (pendingParticipants.length > 0) {
      hints.push({
        text: `Обработать ${pendingParticipants.length} заявку${pendingParticipants.length > 1 ? 'и' : 'у'}`,
        priority: 'high',
      });
    } else {
      hints.push({
        text: 'Поделиться ссылкой на проект',
        priority: 'medium',
      });
    }

    if (approvedParticipants.length > 0) {
      hints.push({
        text: 'Назначить роли участникам',
        priority: 'high',
      });
    } else {
      hints.push({
        text: 'Назначить роли участникам',
        priority: 'low',
      });
    }

    if (project.skills.length === 0) {
      hints.push({
        text: 'Добавить ключевые навыки',
        priority: 'high',
      });
    } else {
      hints.push({
        text: 'Обновить список навыков',
        priority: 'low',
      });
    }

    return hints;
  }, [pendingParticipants.length, approvedParticipants.length, project.skills.length]);
  const hasSummaryDescription = useMemo(() => hasRichTextContent(description), [description]);
  const sanitizedSummaryDescription = useMemo(
    () => sanitizeHtml(description),
    [description],
  );

  const handleCopyLink = useCallback(() => {
    if (!projectLink) {
      return;
    }

    if (typeof window !== 'undefined' && window.navigator?.clipboard) {
      window.navigator.clipboard
        .writeText(projectLink)
        .then(() => {
          toast.success('Ссылка скопирована');
        })
        .catch(() => {
          toast.error('Не удалось скопировать ссылку');
        });
      return;
    }

    if (typeof document !== 'undefined') {
      const textarea = document.createElement('textarea');
      textarea.value = projectLink;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        toast.success('Ссылка скопирована');
      } catch {
        toast.error('Не удалось скопировать ссылку');
      } finally {
        document.body.removeChild(textarea);
      }
      return;
    }

    toast.error('Не удалось скопировать ссылку');
  }, [projectLink]);

  const handleOpenPublicPage = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.open(getProjectUrl(project.id), '_blank', 'noopener');
    }
  }, [project.id]);

  // Функция для получения отображаемого имени участника
  const getParticipantDisplayName = useCallback((participant: { userId: string; userName: string | null; userEmail: string | null }) => {
    const isCurrentUser = userId !== null && participant.userId === String(userId);
    
    if (isCurrentUser) {
      const fullName = getFullNameFromToken(token);
      if (fullName) {
        return `(я) ${fullName}`;
      }
    }
    
    // Если есть имя или email, используем их
    if (participant.userName || participant.userEmail) {
      return participant.userName || participant.userEmail || 'Неизвестный';
    }
    
    // Если имени нет, проверяем кэш
    const cachedUser = userDetailsCache[participant.userId];
    if (cachedUser) {
      const fullName = getUserFullName(cachedUser);
      if (fullName) {
        return fullName;
      }
      if (cachedUser.email) {
        return cachedUser.email;
      }
    }
    
    // Если пользователя нет в кэше, загружаем его
    if (onLoadUser && cachedUser === undefined) {
      void onLoadUser(participant.userId);
    }
    
    return 'Неизвестный';
  }, [userId, token, userDetailsCache, onLoadUser]);

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleCancel}
      title="Управление командой"
      contentClassName={styles.sheetContent}
    >
      <div className={styles.manageContent}>
        <section className={cn(styles.manageSection, styles.manageSummary)}>
          <div className={styles.summaryHeader}>
            <div className={styles.summaryTitleBlock}>
              <Typography.Title className={styles.summaryProjectTitle}>{project.title}</Typography.Title>
              {hasSummaryDescription ? (
                <div
                  className={cn(styles.summaryDescription, styles.formattedDescription)}
                  dangerouslySetInnerHTML={{ __html: sanitizedSummaryDescription }}
                />
              ) : (
                <Typography.Body className={styles.summaryDescription}>
                  Расскажите о цели команды и ожидаемом результате, чтобы участники сразу понимали задачу.
                </Typography.Body>
              )}
            </div>
            <div className={styles.summaryActionsRow}>
              <Button
                type="button"
                size="small"
                mode="secondary"
                appearance="neutral"
                className={styles.summaryActionButton}
                onClick={handleOpenPublicPage}
              >
                Открыть страницу
              </Button>
              <Button
                type="button"
                size="small"
                mode="primary"
                appearance="themed"
                className={styles.summaryActionButton}
                onClick={handleCopyLink}
              >
                Скопировать ссылку
              </Button>
            </div>
          </div>

          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Статус команды</span>
              <div className={styles.summaryValueWrapper}>
                <span className={styles.summaryValue}>
                  {approvedParticipants.length > 0
                    ? `${approvedParticipants.length} участник${approvedParticipants.length > 1 ? 'ов' : ''}`
                    : 'Участников пока нет'}
                </span>
                {pendingParticipants.length > 0 && (
                  <span className={styles.summaryBadge} aria-label={`Заявок в ожидании: ${pendingParticipants.length}`}>
                    {pendingParticipants.length}
                  </span>
                )}
              </div>
              <span className={styles.summarySubtitle}>
                {pendingParticipants.length > 0
                  ? `Заявок в ожидании: ${pendingParticipants.length}`
                  : 'Новых заявок нет'}
              </span>
            </div>

            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Событие</span>
              <span className={styles.summaryValue}>{project.event ? project.event.title : 'Не выбрано'}</span>
              <span className={styles.summarySubtitle}>
                {project.event && eventDateRange
                  ? eventDateRange
                  : 'Привяжите проект к событию'}
              </span>
            </div>

            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Что делать дальше</span>
              <ul className={styles.summaryList}>
                {summaryHints.map((hint, index) => {
                  const priorityClass =
                    hint.priority === 'high'
                      ? styles.summaryHintItemHigh
                      : hint.priority === 'medium'
                        ? styles.summaryHintItemMedium
                        : styles.summaryHintItemLow;

                  return (
                    <li key={index} className={cn(styles.summaryHintItem, priorityClass)}>
                      <span className={styles.summaryHintText}>{hint.text}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </section>

        <section className={styles.manageSection}>
          <Typography.Title className={styles.manageSectionTitle}>Редактирование проекта</Typography.Title>
          <div className={styles.form}>
            <div className={styles.formField}>
              <label htmlFor="edit-project-title" className={styles.label}>
                Название проекта *
              </label>
              <input
                id="edit-project-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Введите название"
                className={styles.input}
                disabled={isProcessing}
              />
            </div>

            <div className={styles.formField}>
              <label htmlFor="edit-project-description" className={styles.label}>
                Описание
              </label>
              <RichTextEditor
                id="edit-project-description"
                value={description}
                onChange={setDescription}
                placeholder="Опишите ваш проект"
                disabled={isProcessing}
              />
            </div>

          </div>
        </section>

        {pendingParticipants.length > 0 ? (
          <section className={styles.manageSection}>
            <Typography.Title className={styles.manageSectionTitle}>
              Заявки на участие ({pendingParticipants.length})
            </Typography.Title>
            <ul className={styles.participantsList}>
              {pendingParticipants.map((participant) => {
                const isParticipantProcessing = pendingActionIds.has(`approve-${participant.id}`) ||
                  pendingActionIds.has(`reject-${participant.id}`);

                return (
                  <li key={participant.id} className={styles.participantItem}>
                    <div className={styles.participantInfo}>
                      <Typography.Body className={styles.participantName}>
                        {getParticipantDisplayName(participant)}
                      </Typography.Body>
                      {participant.userEmail ? (
                        <Typography.Body className={styles.participantEmail}>
                          {participant.userEmail}
                        </Typography.Body>
                      ) : null}
                    </div>
                    <div className={styles.participantActions}>
                      <Button
                        type="button"
                        size="small"
                        mode="primary"
                        appearance="themed"
                        onClick={() => onApproveParticipant(project.id, participant.id)}
                        disabled={isParticipantProcessing}
                        aria-busy={isParticipantProcessing}
                      >
                        Одобрить
                      </Button>
                      <Button
                        type="button"
                        size="small"
                        mode="secondary"
                        appearance="neutral"
                        onClick={() => onRejectParticipant(project.id, participant.id)}
                        disabled={isParticipantProcessing}
                        aria-busy={isParticipantProcessing}
                      >
                        Отклонить
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {approvedParticipants.length > 0 ? (
          <section className={styles.manageSection}>
            <Typography.Title className={styles.manageSectionTitle}>
              Участники команды ({approvedParticipants.length})
            </Typography.Title>
            <ul className={styles.participantsList}>
              {approvedParticipants.map((participant) => {
                const isParticipantProcessing = pendingActionIds.has(`remove-${participant.id}`) ||
                  pendingActionIds.has(`update-role-${participant.id}`);

                return (
                  <li key={participant.id} className={styles.participantItem}>
                    <div className={styles.participantInfo}>
                      <Typography.Body className={styles.participantName}>
                        {getParticipantDisplayName(participant)}
                      </Typography.Body>
                      {participant.userEmail ? (
                        <Typography.Body className={styles.participantEmail}>
                          {participant.userEmail}
                        </Typography.Body>
                      ) : null}
                      {participant.roleName ? (
                        <Typography.Body className={styles.participantRole}>
                          Роль: {participant.roleName}
                        </Typography.Body>
                      ) : null}
                    </div>
                    <div className={styles.participantActions}>
                      <RoleSelector
                        participantId={participant.id}
                        currentRoleName={participant.roleName}
                        teamRoles={teamRoles}
                        onSelect={(roleIdOrName) => {
                          if (roleIdOrName) {
                            onUpdateParticipantRole(project.id, participant.id, roleIdOrName);
                          }
                        }}
                        disabled={isParticipantProcessing}
                      />
                      {participant.userId !== String(userId ?? '') ? (
                        <Button
                          type="button"
                          size="small"
                          mode="secondary"
                          appearance="neutral"
                          onClick={() => onRemoveParticipant(project.id, participant.id)}
                          disabled={isParticipantProcessing}
                          aria-busy={isParticipantProcessing}
                        >
                          Удалить
                        </Button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        <div className={styles.formActions}>
          <Button
            type="button"
            size="medium"
            mode="primary"
            appearance="themed"
            onClick={handleSubmit}
            disabled={isProcessing || !title.trim()}
            aria-busy={isProcessing}
          >
            Сохранить изменения
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}

