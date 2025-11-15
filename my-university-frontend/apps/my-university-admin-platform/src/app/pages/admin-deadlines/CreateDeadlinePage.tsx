/* eslint-env browser */
/// <reference lib="dom" />
import type { ChangeEvent, FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { createDeadline, type DeadlineAccessScope } from '@api/deadline';
import {
  fetchStructureTree,
  type StructureTree,
  type FacultyNode,
  type ProgramNode,
  type CourseNode,
  type GroupNode,
} from '@api/structure';

import { PageShell } from '../../../shared/layout';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Select,
  Textarea,
} from '../../../shared/ui';
import { SearchableDropdown } from '../../../shared/ui/searchable-dropdown';

type GroupOption = {
  id: number;
  label: string;
};

type DeadlineFormState = {
  groupId: number | null;
  title: string;
  descriptionHtml: string;
  dueAt: string;
  accessScope: DeadlineAccessScope;
  scheduleEntryId: string;
};

function createDefaultDueDate(): string {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  now.setHours(now.getHours() + 24);
  return toDateTimeLocal(now.toISOString());
}

function toDateTimeLocal(value: string): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

function buildGroupOptions(tree: StructureTree): GroupOption[] {
  const options: GroupOption[] = [];

  tree.faculties.forEach((faculty: FacultyNode) => {
    faculty.programs.forEach((program: ProgramNode) => {
      program.courses.forEach((course: CourseNode) => {
        course.groups.forEach((group: GroupNode) => {
          options.push({
            id: group.id,
            label: `${faculty.name} • ${program.name} • ${course.title} • ${group.label}`,
          });
        });
      });
    });
  });

  return options;
}

function createDefaultFormState(): DeadlineFormState {
  return {
    groupId: null,
    title: '',
    descriptionHtml: '',
    dueAt: createDefaultDueDate(),
    accessScope: 'GroupMembers',
    scheduleEntryId: '',
  };
}

export function CreateDeadlinePage() {
  const navigate = useNavigate();
  const [formState, setFormState] = useState<DeadlineFormState>(createDefaultFormState);
  const [formError, setFormError] = useState<string | null>(null);
  const [groupOptions, setGroupOptions] = useState<GroupOption[]>([]);
  const [isGroupsLoading, setIsGroupsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validationErrors = useMemo(() => {
    const errors: string[] = [];

    if (!formState.groupId) {
      errors.push('Выберите учебную группу');
    }
    if (!formState.title.trim()) {
      errors.push('Название дедлайна обязательно');
    }
    if (!formState.descriptionHtml.trim()) {
      errors.push('Описание дедлайна обязательно');
    }

    const dueAt = formState.dueAt ? new Date(formState.dueAt).toISOString() : null;
    if (!dueAt) {
      errors.push('Дата и время дедлайна обязательны');
    }
    if (dueAt && new Date(dueAt) <= new Date()) {
      errors.push('Дата дедлайна должна быть в будущем');
    }

    return errors;
  }, [formState]);

  const isFormValid = validationErrors.length === 0;

  const loadGroups = useCallback(async () => {
    setIsGroupsLoading(true);
    try {
      const tree = await fetchStructureTree();
      const options = buildGroupOptions(tree);
      setGroupOptions(options);
      if (options.length === 0) {
        toast.message('Группы пока не созданы', {
          description: 'Добавьте группы в модуле структуры, чтобы создавать дедлайны.',
        });
      }
    } catch (error) {
      console.error('[admin-deadlines] failed to load structure tree', error);
      toast.error('Не удалось загрузить список групп');
      setGroupOptions([]);
    } finally {
      setIsGroupsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

  const handleFormFieldChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = event.target;
      setFormState((prev) => ({ ...prev, [name]: value }));
      setFormError(null);
    },
    [],
  );

  const handleTextareaChange = useCallback(
    (event: ChangeEvent<{ name: string; value: string }>) => {
      const { name, value } = event.target;
      setFormState((prev) => ({ ...prev, [name]: value }));
      setFormError(null);
    },
    [],
  );

  const handleGroupChange = useCallback((groupId: number) => {
    setFormState((prev) => ({ ...prev, groupId }));
    setFormError(null);
  }, []);

  const handleAccessScopeChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    const newScope = event.target.value as DeadlineAccessScope;
    setFormState((prev) => ({
      ...prev,
      accessScope: newScope,
    }));
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!isFormValid || !formState.groupId) {
        setFormError(validationErrors[0] ?? 'Проверьте правильность заполнения формы');
        return;
      }

      setIsSubmitting(true);
      setFormError(null);

      try {
        const dueAtIso = new Date(formState.dueAt).toISOString();
        const scheduleEntryId = formState.scheduleEntryId.trim()
          ? Number.parseInt(formState.scheduleEntryId, 10)
          : null;

        await createDeadline({
          groupId: formState.groupId,
          title: formState.title.trim(),
          descriptionHtml: formState.descriptionHtml.trim(),
          dueAt: dueAtIso,
          accessScope: formState.accessScope,
          scheduleEntryId,
        });

        toast.success('Дедлайн успешно создан');
        navigate('/deadlines');
      } catch (error: unknown) {
        console.error('[admin-deadlines] failed to create deadline', error);
        const message = error instanceof Error ? error.message : 'Не удалось создать дедлайн';
        setFormError(message);
        toast.error(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [formState, isFormValid, validationErrors, navigate],
  );

  const selectedGroup = useMemo(() => {
    if (!formState.groupId) {
      return null;
    }
    return groupOptions.find((option) => option.id === formState.groupId) ?? null;
  }, [formState.groupId, groupOptions]);

  return (
    <PageShell
      title="Создать дедлайн"
      description="Добавьте новый дедлайн для учебной группы. Студенты увидят его в своих списках задач."
    >
      <Card className="bg-card/60 backdrop-blur">
        <CardHeader>
          <CardTitle>Новый дедлайн</CardTitle>
          <CardDescription>
            Заполните форму, чтобы создать дедлайн для выбранной группы
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {formError ? (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
                {formError}
              </div>
            ) : null}

            <div className="space-y-2">
              <SearchableDropdown<GroupOption>
                label={
                  <span>
                    Учебная группа <span className="text-destructive">*</span>
                  </span>
                }
                options={groupOptions}
                value={selectedGroup?.id ?? null}
                onChange={handleGroupChange}
                placeholder={isGroupsLoading ? 'Загрузка групп...' : 'Выберите группу'}
                disabled={isGroupsLoading}
              />
              {selectedGroup ? (
                <p className="text-xs text-muted-foreground">
                  Вы выбрали: <span className="font-medium text-foreground">{selectedGroup.label}</span>
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Выберите группу, для которой создается дедлайн
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium text-foreground">
                Название дедлайна <span className="text-destructive">*</span>
              </label>
              <Input
                id="title"
                name="title"
                type="text"
                value={formState.title}
                onChange={handleFormFieldChange}
                placeholder="Например: Контрольная работа по математике"
                required
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Краткое название дедлайна, которое увидят студенты
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="descriptionHtml" className="text-sm font-medium text-foreground">
                Описание <span className="text-destructive">*</span>
              </label>
              <Textarea
                id="descriptionHtml"
                name="descriptionHtml"
                value={formState.descriptionHtml}
                onChange={handleTextareaChange}
                placeholder="Подробное описание задания, требований и критериев оценки..."
                rows={6}
                required
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Подробное описание задания и требований к выполнению
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="dueAt" className="text-sm font-medium text-foreground">
                Дата и время дедлайна <span className="text-destructive">*</span>
              </label>
              <Input
                id="dueAt"
                name="dueAt"
                type="datetime-local"
                value={formState.dueAt}
                onChange={handleFormFieldChange}
                required
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Дата и время, до которого нужно выполнить задание
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="accessScope" className="text-sm font-medium text-foreground">
                Видимость дедлайна
              </label>
              <Select
                id="accessScope"
                name="accessScope"
                value={formState.accessScope}
                onChange={handleAccessScopeChange}
                disabled={isSubmitting}
              >
                <option value="GroupMembers">Члены группы</option>
                <option value="TeachersOnly">Только преподаватели</option>
                <option value="Administrators">Только администраторы</option>
              </Select>
              <p className="text-xs text-muted-foreground">
                Кто сможет видеть этот дедлайн
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="scheduleEntryId" className="text-sm font-medium text-foreground">
                ID занятия (опционально)
              </label>
              <Input
                id="scheduleEntryId"
                name="scheduleEntryId"
                type="number"
                value={formState.scheduleEntryId}
                onChange={handleFormFieldChange}
                placeholder="Оставьте пустым, если не привязано к занятию"
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Привяжите дедлайн к конкретному занятию из расписания
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/deadlines')}
                disabled={isSubmitting}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={!isFormValid || isSubmitting} isLoading={isSubmitting}>
                Создать дедлайн
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageShell>
  );
}

