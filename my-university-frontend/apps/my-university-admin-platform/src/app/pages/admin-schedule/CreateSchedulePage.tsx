/* eslint-env browser */
/// <reference lib="dom" />
import type { FormEvent, ChangeEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { createGroupLesson } from '@api/admin';
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
  Badge,
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

type DeliveryType = 'Offline' | 'Online';

type GroupOption = {
  id: number;
  label: string;
};

type ScheduleFormState = {
  groupId: number | null;
  title: string;
  description: string;
  teacher: string;
  deliveryType: DeliveryType;
  physicalLocation: string;
  onlineLink: string;
  startDateTime: string;
  endDateTime: string;
};

function createDefaultStartDate(): string {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  now.setHours(now.getHours() + 1);
  return toDateTimeLocal(now.toISOString());
}

function createDefaultEndDate(start: string): string {
  const startDate = new Date(start);
  if (Number.isNaN(startDate.getTime())) {
    const fallback = new Date();
    fallback.setHours(fallback.getHours() + 2);
    return toDateTimeLocal(fallback.toISOString());
  }

  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + 2);
  return toDateTimeLocal(endDate.toISOString());
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

function toIsoString(value: string): string | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
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

function createDefaultFormState(): ScheduleFormState {
  const start = createDefaultStartDate();
  return {
    groupId: null,
    title: '',
    description: '',
    teacher: '',
    deliveryType: 'Offline',
    physicalLocation: '',
    onlineLink: '',
    startDateTime: start,
    endDateTime: createDefaultEndDate(start),
  };
}

export function CreateSchedulePage() {
  const navigate = useNavigate();
  const [formState, setFormState] = useState<ScheduleFormState>(createDefaultFormState);
  const [formError, setFormError] = useState<string | null>(null);
  const [groupOptions, setGroupOptions] = useState<ReadonlyArray<GroupOption>>([]);
  const [isGroupsLoading, setIsGroupsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validationErrors = useMemo(() => {
    const errors: string[] = [];

    if (!formState.groupId) {
      errors.push('Выберите учебную группу');
    }
    if (!formState.title.trim()) {
      errors.push('Название занятия обязательно');
    }
    if (!formState.description.trim()) {
      errors.push('Описание занятия обязательно');
    }

    const startDateTime = toIsoString(formState.startDateTime);
    const endDateTime = toIsoString(formState.endDateTime);
    if (!startDateTime) {
      errors.push('Дата и время начала обязательны');
    }
    if (!endDateTime) {
      errors.push('Дата и время окончания обязательны');
    }
    if (startDateTime && endDateTime && new Date(startDateTime) >= new Date(endDateTime)) {
      errors.push('Дата окончания должна быть позже даты начала');
    }

    if (formState.deliveryType === 'Offline' && !formState.physicalLocation.trim()) {
      errors.push('Для офлайн-занятия укажите аудиторию или адрес');
    }

    if (formState.deliveryType === 'Online' && !formState.onlineLink.trim()) {
      errors.push('Для онлайн-занятия укажите ссылку');
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
          description: 'Добавьте группы в модуле структуры, чтобы планировать занятия.',
        });
      }
    } catch (error) {
      console.error('[admin-schedule] failed to load structure tree', error);
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
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = event.target;
      setFormState((prev) => {
        if (name === 'startDateTime') {
          return {
            ...prev,
            startDateTime: value,
            endDateTime:
              new Date(value).getTime() >= new Date(prev.endDateTime).getTime()
                ? createDefaultEndDate(value)
                : prev.endDateTime,
          };
        }

        return { ...prev, [name]: value };
      });
      setFormError(null);
    },
    [],
  );

  const handleGroupChange = useCallback((groupId: number) => {
    setFormState((prev) => ({ ...prev, groupId }));
    setFormError(null);
  }, []);

  const handleDeliveryTypeChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    const newType = event.target.value as DeliveryType;
    setFormState((prev) => ({
      ...prev,
      deliveryType: newType,
    }));
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setFormError(null);

      if (!formState.groupId) {
        setFormError('Выберите учебную группу');
        return;
      }

      const startsAt = toIsoString(formState.startDateTime);
      const endsAt = toIsoString(formState.endDateTime);

      if (!startsAt || !endsAt) {
        setFormError('Укажите корректные даты начала и окончания');
        return;
      }

      if (new Date(startsAt) >= new Date(endsAt)) {
        setFormError('Дата окончания должна быть позже даты начала');
        return;
      }

      setIsSubmitting(true);

      try {
        await createGroupLesson({
          groupId: formState.groupId,
          title: formState.title.trim(),
          description: formState.description.trim(),
          teacher: formState.teacher.trim(),
          deliveryType: formState.deliveryType,
          physicalLocation: formState.physicalLocation.trim(),
          onlineLink: formState.onlineLink.trim(),
          startsAt,
          endsAt,
        });

        toast.success('Занятие добавлено в расписание');
        setFormState((prev) => ({
          ...createDefaultFormState(),
          groupId: prev.groupId,
          deliveryType: prev.deliveryType,
        }));
      } catch (error) {
        console.error('[admin-schedule] failed to create lesson', error);
        setFormError('Не удалось сохранить занятие. Проверьте данные и попробуйте снова.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [formState],
  );

  const selectedGroup = useMemo(
    () => groupOptions.find((option) => option.id === formState.groupId) ?? null,
    [formState.groupId, groupOptions],
  );

  return (
    <PageShell
      title="Добавление занятия для студентов"
      description="Запланируйте пару или дополнительную активность для конкретной группы."
    >
      <Card className="bg-card/60 backdrop-blur">
        <CardHeader className="space-y-2">
          <Badge variant="secondary" className="w-fit">
            Расписание
          </Badge>
          <CardTitle>Новая запись</CardTitle>
          <CardDescription>
            Заполните форму, чтобы добавить пару или активность в общее расписание группы. Студенты
            увидят новость сразу после сохранения.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {formError ? (
            <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
              {formError}
            </div>
          ) : null}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <SearchableDropdown
                label={
                  <span>
                    Учебная группа <span className="text-destructive">*</span>
                  </span>
                }
                value={formState.groupId}
                options={groupOptions as GroupOption[]}
                onChange={handleGroupChange}
                placeholder={
                  isGroupsLoading ? 'Загрузка групп...' : 'Выберите группу из структуры университета'
                }
                disabled={isGroupsLoading || groupOptions.length === 0}
              />
              {selectedGroup ? (
                <p className="text-xs text-muted-foreground">
                  Вы выбрали: <span className="font-medium text-foreground">{selectedGroup.label}</span>
                </p>
              ) : null}
            </div>

            <div className="space-y-3">
              <label htmlFor="title" className="text-sm text-muted-foreground">
                Название занятия <span className="text-destructive">*</span>
              </label>
              <Input
                id="title"
                name="title"
                value={formState.title}
                onChange={handleFormFieldChange}
                placeholder="Например, Лекция по дискретной математике"
                maxLength={180}
                autoComplete="off"
                required
              />
            </div>

            <div className="space-y-3">
              <label htmlFor="description" className="text-sm text-muted-foreground">
                Краткое описание <span className="text-destructive">*</span>
              </label>
              <Textarea
                id="description"
                name="description"
                value={formState.description}
                onChange={handleFormFieldChange}
                placeholder="Расскажите, что именно будет на занятии и какие материалы нужны."
                maxLength={2000}
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <label htmlFor="teacher" className="text-sm text-muted-foreground">
                  Преподаватель
                </label>
                <Input
                  id="teacher"
                  name="teacher"
                  value={formState.teacher}
                  onChange={handleFormFieldChange}
                  placeholder="Например, Проф. Игорь Мещеряков"
                  maxLength={160}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-3">
                <label htmlFor="deliveryType" className="text-sm text-muted-foreground">
                  Формат проведения <span className="text-destructive">*</span>
                </label>
                <Select
                  id="deliveryType"
                  name="deliveryType"
                  value={formState.deliveryType}
                  onChange={handleDeliveryTypeChange}
                >
                  <option value="Offline">Офлайн</option>
                  <option value="Online">Онлайн</option>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <label className="text-sm text-muted-foreground">
                  Время начала <span className="text-destructive">*</span>
                </label>
                <Input
                  type="datetime-local"
                  name="startDateTime"
                  value={formState.startDateTime}
                  onChange={handleFormFieldChange}
                  required
                />
              </div>
              <div className="space-y-3">
                <label className="text-sm text-muted-foreground">
                  Время окончания <span className="text-destructive">*</span>
                </label>
                <Input
                  type="datetime-local"
                  name="endDateTime"
                  value={formState.endDateTime}
                  onChange={handleFormFieldChange}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <label htmlFor="physicalLocation" className="text-sm text-muted-foreground">
                  Аудитория / адрес {formState.deliveryType === 'Offline' ? '*' : '(необязательно)'}
                </label>
                <Input
                  id="physicalLocation"
                  name="physicalLocation"
                  value={formState.physicalLocation}
                  onChange={handleFormFieldChange}
                  placeholder="Например, Корпус А, аудитория 405"
                  disabled={formState.deliveryType === 'Online'}
                />
              </div>
              <div className="space-y-3">
                <label htmlFor="onlineLink" className="text-sm text-muted-foreground">
                  Ссылка на трансляцию{' '}
                  {formState.deliveryType === 'Online' ? '*' : '(заполните при необходимости)'}
                </label>
                <Input
                  id="onlineLink"
                  name="onlineLink"
                  value={formState.onlineLink}
                  onChange={handleFormFieldChange}
                  placeholder="https://meet.max.ru/lesson"
                  disabled={formState.deliveryType === 'Offline'}
                  type="url"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                className="flex-1"
                isLoading={isSubmitting}
                disabled={!isFormValid || isSubmitting}
                title={
                  !isFormValid && validationErrors.length > 0
                    ? `Для сохранения заполните:\n${validationErrors.join('\n')}`
                    : undefined
                }
              >
                Сохранить занятие
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/')}
                disabled={isSubmitting}
              >
                Назад на главную
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageShell>
  );
}

