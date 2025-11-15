import type { FormEvent, ReactElement, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { ApiError } from '@api/shared/api/api-client';
import {
  addGroupMember,
  createFaculty,
  createGroup,
  createProgram,
  createProgramCourse,
  fetchStructureTree,
} from '@api/structure';
import type {
  CourseNode,
  CustomGroupCreatorRole,
  CustomGroupModerationStatus,
  CustomGroupVisibility,
  DegreeLevel,
  FacultyNode,
  GroupMembershipType,
  GroupNode,
  GroupType,
  ProgramNode,
  StructureTree,
} from '@api/structure';

import { ChevronDownIcon, ChevronRightIcon } from '@shared/icons';

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
  Label,
  SearchableDropdown,
  Select,
  Skeleton,
} from '../../../shared/ui';
import { cn } from '../../../shared/utils/className';

type CustomMetaMode = 'disabled' | 'enabled';

const DEGREE_LEVEL_OPTIONS: Array<{ value: DegreeLevel; label: string }> = [
  { value: 'Bachelor', label: 'Бакалавриат' },
  { value: 'Specialist', label: 'Специалитет' },
  { value: 'Master', label: 'Магистратура' },
  { value: 'PhD', label: 'Аспирантура' },
];

const GROUP_TYPE_OPTIONS: Array<{ value: GroupType; label: string; hint: string }> = [
  { value: 'Main', label: 'Основная', hint: 'Линейная академическая группа' },
  { value: 'CustomAdmin', label: 'Кастомная (админ)', hint: 'Создана сотрудником' },
  { value: 'CustomUser', label: 'Кастомная (студ.)', hint: 'Создана студентом/преподавателем' },
];

const MEMBERSHIP_OPTIONS: Array<{ value: GroupMembershipType; label: string }> = [
  { value: 'Primary', label: 'Основное' },
  { value: 'Auxiliary', label: 'Дополнительное' },
];

const CREATOR_ROLE_OPTIONS: Array<{ value: CustomGroupCreatorRole; label: string }> = [
  { value: 'Admin', label: 'Администратор' },
  { value: 'Teacher', label: 'Преподаватель' },
  { value: 'Student', label: 'Студент' },
];

const VISIBILITY_OPTIONS: Array<{ value: CustomGroupVisibility; label: string }> = [
  { value: 'Tenant', label: 'Всем в вузе' },
  { value: 'Private', label: 'По приглашению' },
];

const MODERATION_OPTIONS: Array<{ value: CustomGroupModerationStatus; label: string }> = [
  { value: 'Approved', label: 'Одобрено' },
  { value: 'Pending', label: 'На модерации' },
  { value: 'Blocked', label: 'Заблокировано' },
];

const getFacultyNodeId = (facultyId: number) => `faculty-${facultyId}`;
const getProgramNodeId = (facultyId: number, programId: number) =>
  `${getFacultyNodeId(facultyId)}-program-${programId}`;
const getCourseNodeId = (facultyId: number, programId: number, courseId: number) =>
  `${getProgramNodeId(facultyId, programId)}-course-${courseId}`;

export function AdminStructurePage(): ReactElement {
  const [tree, setTree] = useState<StructureTree | null>(null);
  const [isTreeLoading, setIsTreeLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [treeError, setTreeError] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const [selectedFacultyId, setSelectedFacultyId] = useState<number | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  const [facultyName, setFacultyName] = useState('');
  const [facultyCode, setFacultyCode] = useState('');
  const [isFacultySubmitting, setIsFacultySubmitting] = useState(false);

  const [programName, setProgramName] = useState('');
  const [programDegree, setProgramDegree] = useState<DegreeLevel>('Bachelor');
  const [isProgramSubmitting, setIsProgramSubmitting] = useState(false);

  const [courseNumber, setCourseNumber] = useState('1');
  const [courseTitle, setCourseTitle] = useState('');
  const [courseEcts, setCourseEcts] = useState('30');
  const [isCourseSubmitting, setIsCourseSubmitting] = useState(false);

  const [groupLabel, setGroupLabel] = useState('');
  const [groupType, setGroupType] = useState<GroupType>('Main');
  const [groupCapacity, setGroupCapacity] = useState('30');
  const [groupPrimaryAllowed, setGroupPrimaryAllowed] = useState<'true' | 'false'>('true');
  const [customMetaMode, setCustomMetaMode] = useState<CustomMetaMode>('disabled');
  const [customMetaUserId, setCustomMetaUserId] = useState('');
  const [customMetaRole, setCustomMetaRole] = useState<CustomGroupCreatorRole>('Admin');
  const [customMetaVisibility, setCustomMetaVisibility] = useState<CustomGroupVisibility>('Tenant');
  const [customMetaModeration, setCustomMetaModeration] =
    useState<CustomGroupModerationStatus>('Approved');
  const [isGroupSubmitting, setIsGroupSubmitting] = useState(false);

  const [memberStudentId, setMemberStudentId] = useState('');
  const [memberType, setMemberType] = useState<GroupMembershipType>('Primary');
  const [isMemberSubmitting, setIsMemberSubmitting] = useState(false);

  const loadStructure = useCallback(
    async (options?: { silent?: boolean; signal?: AbortSignal }) => {
      const silent = options?.silent ?? false;

      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsTreeLoading(true);
      }

      setTreeError(null);

      try {
        const response = await fetchStructureTree({ signal: options?.signal });
        setTree(response);
      } catch (error: unknown) {
        if (options?.signal?.aborted) {
          return;
        }

        const message = resolveErrorMessage(error);
        setTreeError(message);
        toast.error(message);
      } finally {
        if (silent) {
          setIsRefreshing(false);
        } else {
          setIsTreeLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadStructure({ signal: controller.signal });

    return () => {
      controller.abort();
    };
  }, [loadStructure]);

  const selectedFaculty = useMemo(
    () => tree?.faculties.find((faculty: FacultyNode) => faculty.id === selectedFacultyId) ?? null,
    [tree, selectedFacultyId],
  );

  const selectedProgram = useMemo(() => {
    if (!selectedFaculty) {
      return null;
    }
    return selectedFaculty.programs.find((program: ProgramNode) => program.id === selectedProgramId) ?? null;
  }, [selectedFaculty, selectedProgramId]);

  const selectedCourse = useMemo(() => {
    if (!selectedProgram) {
      return null;
    }
    return selectedProgram.courses.find((course: CourseNode) => course.id === selectedCourseId) ?? null;
  }, [selectedProgram, selectedCourseId]);

  const selectedGroup = useMemo(() => {
    if (!selectedCourse) {
      return null;
    }
    return selectedCourse.groups.find((group: GroupNode) => group.id === selectedGroupId) ?? null;
  }, [selectedCourse, selectedGroupId]);

  const facultyOptions = useMemo(() => tree?.faculties ?? [], [tree]);
  const programOptions = useMemo(() => {
    if (selectedFaculty) {
      return selectedFaculty.programs;
    }

    return tree?.faculties.flatMap((faculty: FacultyNode) => faculty.programs) ?? [];
  }, [selectedFaculty, tree]);
  const courseOptions = useMemo(
    () =>
      selectedProgram?.courses.map((course: CourseNode) => ({
        id: course.id,
        label: `Курс ${course.courseNumber} — ${course.title}`,
      })) ?? [],
    [selectedProgram],
  );
  const groupOptions = useMemo(
    () =>
      selectedCourse?.groups.map((group: GroupNode) => ({
        id: group.id,
        label: `${group.label} (${group.type})`,
      })) ?? [],
    [selectedCourse],
  );

  const facultyValidationErrors = useMemo(() => {
    const errors: Array<string> = [];
    if (!facultyName.trim()) {
      errors.push('Название факультета обязательно');
    }
    if (!facultyCode.trim()) {
      errors.push('Код факультета обязателен');
    }
    return errors;
  }, [facultyName, facultyCode]);

  const isFacultyFormValid = facultyValidationErrors.length === 0;

  const programValidationErrors = useMemo(() => {
    const errors: Array<string> = [];
    if (!selectedFacultyId) {
      errors.push('Необходимо выбрать факультет');
    }
    if (!programName.trim()) {
      errors.push('Название программы обязательно');
    }
    if (!programDegree) {
      errors.push('Уровень программы обязателен');
    }
    return errors;
  }, [selectedFacultyId, programName, programDegree]);

  const isProgramFormValid = programValidationErrors.length === 0;

  const courseValidationErrors = useMemo(() => {
    const errors: Array<string> = [];
    if (!selectedProgramId) {
      errors.push('Необходимо выбрать программу');
    }
    if (!courseNumber.trim()) {
      errors.push('Номер курса обязателен');
    }
    if (!courseTitle.trim()) {
      errors.push('Название курса обязательно');
    }
    return errors;
  }, [selectedProgramId, courseNumber, courseTitle]);

  const isCourseFormValid = courseValidationErrors.length === 0;

  const groupValidationErrors = useMemo(() => {
    const errors: Array<string> = [];
    if (!selectedCourseId) {
      errors.push('Необходимо выбрать курс');
    }
    if (!groupLabel.trim()) {
      errors.push('Название группы обязательно');
    }
    if (!groupType) {
      errors.push('Тип группы обязателен');
    }
    return errors;
  }, [selectedCourseId, groupLabel, groupType]);

  const isGroupFormValid = groupValidationErrors.length === 0;

  const memberValidationErrors = useMemo(() => {
    const errors: Array<string> = [];
    if (!selectedGroupId) {
      errors.push('Необходимо выбрать группу');
    }
    if (!memberStudentId.trim()) {
      errors.push('ID студента обязателен');
    }
    if (!memberType) {
      errors.push('Тип членства обязателен');
    }
    return errors;
  }, [selectedGroupId, memberStudentId, memberType]);

  const isMemberFormValid = memberValidationErrors.length === 0;

  const handleFacultyDropdownChange = useCallback((facultyId: number) => {
    setSelectedFacultyId(facultyId);
    setSelectedProgramId(null);
    setSelectedCourseId(null);
    setSelectedGroupId(null);
  }, []);

  const handleProgramDropdownChange = useCallback((programId: number) => {
    setSelectedProgramId(programId);
    setSelectedCourseId(null);
    setSelectedGroupId(null);
  }, []);

  const handleCourseDropdownChange = useCallback((courseId: number) => {
    setSelectedCourseId(courseId);
    setSelectedGroupId(null);
  }, []);

  const handleGroupDropdownChange = useCallback((groupId: number) => {
    setSelectedGroupId(groupId);
  }, []);

  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const summary = useMemo(() => {
    if (!tree) {
      return {
        faculties: 0,
        programs: 0,
        courses: 0,
        groups: 0,
        members: 0,
      };
    }

    const programs = tree.faculties.reduce((total: number, faculty: FacultyNode) => total + faculty.programs.length, 0);
    const courses = tree.faculties.reduce(
      (total: number, faculty: FacultyNode) => total + faculty.programs.reduce((acc: number, program: ProgramNode) => acc + program.courses.length, 0),
      0,
    );
    const groups = tree.faculties.reduce(
      (total: number, faculty: FacultyNode) =>
        total +
        faculty.programs.reduce(
          (programTotal: number, program: ProgramNode) =>
            programTotal + program.courses.reduce((courseTotal: number, course: CourseNode) => courseTotal + course.groups.length, 0),
          0,
        ),
      0,
    );
    const members = tree.faculties.reduce(
      (total: number, faculty: FacultyNode) =>
        total +
        faculty.programs.reduce(
          (programTotal: number, program: ProgramNode) =>
            programTotal +
            program.courses.reduce(
              (courseTotal: number, course: CourseNode) =>
                courseTotal + course.groups.reduce((groupTotal: number, group: GroupNode) => groupTotal + group.members.length, 0),
              0,
            ),
          0,
        ),
      0,
    );

    return {
      faculties: tree.faculties.length,
      programs,
      courses,
      groups,
      members,
    };
  }, [tree]);

  const handleTreeFacultyClick = useCallback(
    (faculty: FacultyNode) => {
      setSelectedFacultyId(faculty.id);
      setSelectedProgramId(null);
      setSelectedCourseId(null);
      setSelectedGroupId(null);
      // Раскрываем факультет, если есть программы
      if (faculty.programs.length > 0) {
        const facultyId = getFacultyNodeId(faculty.id);
        setExpandedNodes((prev) => {
          const next = new Set(prev);
          next.add(facultyId);
          return next;
        });
      }
    },
    [],
  );

  const handleTreeProgramClick = useCallback(
    (faculty: FacultyNode, program: ProgramNode) => {
      setSelectedFacultyId(faculty.id);
      setSelectedProgramId(program.id);
      setSelectedCourseId(null);
      setSelectedGroupId(null);
      // Раскрываем факультет и программу
      const facultyId = getFacultyNodeId(faculty.id);
      const programId = getProgramNodeId(faculty.id, program.id);
      setExpandedNodes((prev) => {
        const next = new Set(prev);
        next.add(facultyId);
        if (program.courses.length > 0) {
          next.add(programId);
        }
        return next;
      });
    },
    [],
  );

  const handleTreeCourseClick = useCallback(
    (faculty: FacultyNode, program: ProgramNode, course: CourseNode) => {
      setSelectedFacultyId(faculty.id);
      setSelectedProgramId(program.id);
      setSelectedCourseId(course.id);
      setSelectedGroupId(null);
      // Раскрываем факультет, программу и курс
      const facultyId = getFacultyNodeId(faculty.id);
      const programId = getProgramNodeId(faculty.id, program.id);
      const courseId = getCourseNodeId(faculty.id, program.id, course.id);
      setExpandedNodes((prev) => {
        const next = new Set(prev);
        next.add(facultyId);
        next.add(programId);
        if (course.groups.length > 0) {
          next.add(courseId);
        }
        return next;
      });
    },
    [],
  );

  const handleTreeGroupClick = useCallback(
    (faculty: FacultyNode, program: ProgramNode, course: CourseNode, group: GroupNode) => {
      setSelectedFacultyId(faculty.id);
      setSelectedProgramId(program.id);
      setSelectedCourseId(course.id);
      setSelectedGroupId(group.id);
      // Раскрываем все родительские узлы до вершины дерева
      const facultyId = getFacultyNodeId(faculty.id);
      const programId = getProgramNodeId(faculty.id, program.id);
      const courseId = getCourseNodeId(faculty.id, program.id, course.id);
      setExpandedNodes((prev) => {
        const next = new Set(prev);
        next.add(facultyId);
        next.add(programId);
        next.add(courseId);
        return next;
      });
    },
    [],
  );

  const handleCreateFaculty = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!facultyName.trim() || !facultyCode.trim()) {
        toast.error('Укажите название и код факультета');
        return;
      }

      setIsFacultySubmitting(true);

      try {
        await createFaculty({
          name: facultyName.trim(),
          code: facultyCode.trim(),
        });
        toast.success('Факультет создан');
        setFacultyName('');
        setFacultyCode('');
        await loadStructure({ silent: true });
      } catch (error: unknown) {
        toast.error(resolveErrorMessage(error));
      } finally {
        setIsFacultySubmitting(false);
      }
    },
    [facultyCode, facultyName, loadStructure],
  );

  const handleCreateProgram = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!selectedFacultyId) {
        toast.error('Выберите факультет');
        return;
      }

      if (!programName.trim()) {
        toast.error('Введите название программы');
        return;
      }

      setIsProgramSubmitting(true);

      try {
        await createProgram({
          facultyId: selectedFacultyId,
          name: programName.trim(),
          degreeLevel: programDegree,
        });
        toast.success('Программа добавлена');
        setProgramName('');
        await loadStructure({ silent: true });
      } catch (error: unknown) {
        toast.error(resolveErrorMessage(error));
      } finally {
        setIsProgramSubmitting(false);
      }
    },
    [loadStructure, programDegree, programName, selectedFacultyId],
  );

  const handleCreateCourse = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!selectedFacultyId || !selectedProgramId) {
        toast.error('Выберите факультет и программу');
        return;
      }

      const parsedCourseNumber = Number(courseNumber);

      if (!Number.isInteger(parsedCourseNumber) || parsedCourseNumber < 1) {
        toast.error('Номер курса должен быть положительным числом');
        return;
      }

      if (!courseTitle.trim()) {
        toast.error('Введите название курса/года');
        return;
      }

      const parsedEcts = courseEcts.trim() ? Number(courseEcts) : null;

      if (parsedEcts !== null && (Number.isNaN(parsedEcts) || parsedEcts < 0)) {
        toast.error('ECTS должен быть неотрицательным числом');
        return;
      }

      setIsCourseSubmitting(true);

      try {
        await createProgramCourse({
          facultyId: selectedFacultyId,
          programId: selectedProgramId,
          courseNumber: parsedCourseNumber,
          title: courseTitle.trim(),
          ects: parsedEcts,
        });
        toast.success('Курс добавлен');
        setCourseTitle('');
        setCourseEcts('30');
        await loadStructure({ silent: true });
      } catch (error: unknown) {
        toast.error(resolveErrorMessage(error));
      } finally {
        setIsCourseSubmitting(false);
      }
    },
    [courseEcts, courseNumber, courseTitle, loadStructure, selectedFacultyId, selectedProgramId],
  );

  const handleCreateGroup = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!selectedFacultyId || !selectedProgramId || !selectedCourseId) {
        toast.error('Выберите факультет, программу и курс');
        return;
      }

      if (!groupLabel.trim()) {
        toast.error('Введите название группы');
        return;
      }

      const capacity = Number(groupCapacity);

      if (!Number.isInteger(capacity) || capacity < 1) {
        toast.error('Вместимость должна быть положительным числом');
        return;
      }

      const isPrimaryAllowed = groupPrimaryAllowed === 'true';
      const meta =
        customMetaMode === 'enabled'
          ? {
              createdByUserId: customMetaUserId.trim() ? Number(customMetaUserId) : null,
              createdByRole: customMetaRole,
              visibility: customMetaVisibility,
              moderationStatus: customMetaModeration,
            }
          : undefined;

      if (meta && meta.createdByUserId !== null && Number.isNaN(meta.createdByUserId)) {
        toast.error('ID создателя должен быть числом');
        return;
      }

      setIsGroupSubmitting(true);

      try {
        await createGroup({
          facultyId: selectedFacultyId,
          programId: selectedProgramId,
          courseId: selectedCourseId,
          type: groupType,
          label: groupLabel.trim(),
          capacity,
          isPrimaryAllowed,
          customMeta: meta,
        });
        toast.success('Группа создана');
        setGroupLabel('');
        setGroupCapacity('30');
        setGroupType('Main');
        setGroupPrimaryAllowed('true');
        setCustomMetaMode('disabled');
        setCustomMetaUserId('');
        await loadStructure({ silent: true });
      } catch (error: unknown) {
        toast.error(resolveErrorMessage(error));
      } finally {
        setIsGroupSubmitting(false);
      }
    },
    [
      customMetaModeration,
      customMetaRole,
      customMetaUserId,
      customMetaVisibility,
      customMetaMode,
      groupCapacity,
      groupLabel,
      groupPrimaryAllowed,
      groupType,
      loadStructure,
      selectedCourseId,
      selectedFacultyId,
      selectedProgramId,
    ],
  );

  const handleAddMember = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!selectedGroupId) {
        toast.error('Выберите группу');
        return;
      }

      if (!memberStudentId.trim()) {
        toast.error('Введите ID студента');
        return;
      }

      const studentId = Number(memberStudentId);

      if (!Number.isInteger(studentId) || studentId < 1) {
        toast.error('ID студента должен быть положительным числом');
        return;
      }

      setIsMemberSubmitting(true);

      try {
        await addGroupMember({
          groupId: selectedGroupId,
          studentId,
          membershipType: memberType,
        });
        toast.success('Студент добавлен в группу');
        setMemberStudentId('');
        await loadStructure({ silent: true });
      } catch (error: unknown) {
        toast.error(resolveErrorMessage(error));
      } finally {
        setIsMemberSubmitting(false);
      }
    },
    [loadStructure, memberStudentId, memberType, selectedGroupId],
  );

  const handleRefresh = useCallback(() => {
    void loadStructure({ silent: true });
  }, [loadStructure]);

  const handleResetSelection = useCallback(() => {
    setSelectedFacultyId(null);
    setSelectedProgramId(null);
    setSelectedCourseId(null);
    setSelectedGroupId(null);
  }, []);

  const renderGroup = (
    faculty: FacultyNode,
    program: ProgramNode,
    course: CourseNode,
    group: GroupNode,
  ) => {
    // Группа выделена, если выбрана именно эта группа
    // Или если выбрана группа из того же курса (для визуального отображения иерархии)
    const isGroupSelected =
      selectedGroupId === group.id ||
      (selectedGroupId !== null &&
        selectedCourseId === course.id &&
        selectedProgramId === program.id &&
        selectedFacultyId === faculty.id);
    return (
      <TreeNodeRow
        key={group.id}
        label={group.label}
        info={
          <div className="flex items-center gap-1">
            <Badge variant="outline">{group.type}</Badge>
            <span className="text-xs text-muted-foreground">{group.members.length} чел.</span>
          </div>
        }
        onSelect={() => handleTreeGroupClick(faculty, program, course, group)}
        isSelected={isGroupSelected}
      />
    );
  };

  const renderCourse = (faculty: FacultyNode, program: ProgramNode, course: CourseNode) => {
    const courseId = getCourseNodeId(faculty.id, program.id, course.id);
    const hasGroups = course.groups.length > 0;
    const isExpanded = expandedNodes.has(courseId);
    // Курс выделен, если выбран именно этот курс, или если выбрана группа из этого курса
    const isCourseSelected =
      selectedCourseId === course.id ||
      (selectedGroupId !== null &&
        selectedCourseId === course.id &&
        selectedProgramId === program.id &&
        selectedFacultyId === faculty.id);

    return (
      <div key={courseId} className="space-y-1">
        <TreeNodeRow
          label={`Курс ${course.courseNumber}`}
          info={<span className="text-xs text-muted-foreground">{course.title}</span>}
          expandable={hasGroups}
          expanded={isExpanded}
          onToggle={hasGroups ? () => toggleNode(courseId) : undefined}
          onSelect={() => handleTreeCourseClick(faculty, program, course)}
          isSelected={isCourseSelected}
        />
        {isExpanded && hasGroups ? (
          <div className="space-y-2 border-l border-border/25 pl-3">
            {course.groups.map((group: GroupNode) => renderGroup(faculty, program, course, group))}
          </div>
        ) : null}
      </div>
    );
  };

  const renderProgram = (faculty: FacultyNode, program: ProgramNode) => {
    const programId = getProgramNodeId(faculty.id, program.id);
    const hasCourses = program.courses.length > 0;
    const isExpanded = expandedNodes.has(programId);
    // Программа выделена, если выбрана именно эта программа, или если выбран курс/группа из этой программы
    const isProgramSelected =
      selectedProgramId === program.id ||
      (selectedCourseId !== null &&
        selectedProgramId === program.id &&
        selectedFacultyId === faculty.id) ||
      (selectedGroupId !== null &&
        selectedProgramId === program.id &&
        selectedFacultyId === faculty.id);

    return (
      <div key={programId} className="space-y-2">
        <TreeNodeRow
          label={program.name}
          info={
            <div className="flex items-center gap-1">
              <Badge variant="outline">{program.degreeLevel}</Badge>
              <span className="text-xs text-muted-foreground">{program.courses.length} курса</span>
            </div>
          }
          expandable={hasCourses}
          expanded={isExpanded}
          onToggle={hasCourses ? () => toggleNode(programId) : undefined}
          onSelect={() => handleTreeProgramClick(faculty, program)}
          isSelected={isProgramSelected}
        />
        {isExpanded && hasCourses ? (
          <div className="space-y-2 border-l border-border/30 pl-3">
            {program.courses.map((course: CourseNode) => renderCourse(faculty, program, course))}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <PageShell
      title="Академическая структура"
      description="Управляйте иерархией факультетов, программ, курсов и учебных групп."
      actions={
        <Button variant="secondary" onClick={handleRefresh} isLoading={isRefreshing}>
          Обновить дерево
        </Button>
      }
    >
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryStat title="Факультеты" value={summary.faculties} />
        <SummaryStat title="Программы" value={summary.programs} />
        <SummaryStat title="Курсы" value={summary.courses} />
        <SummaryStat title="Группы" value={summary.groups} hint={`Студентов: ${summary.members}`} />
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card className="bg-card/60 backdrop-blur">
          <CardHeader>
            <CardTitle>Текущее дерево</CardTitle>
            <CardDescription>Выберите элементы слева, чтобы быстрее заполнять формы справа.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[520px] space-y-3 overflow-y-auto pr-2">
              {isTreeLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-16 rounded-xl" />
                  ))}
                </div>
              ) : treeError ? (
                <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                  {treeError}
                </div>
              ) : tree && tree.faculties.length > 0 ? (
                <div className="space-y-3">
                  {tree.faculties.map((faculty: FacultyNode) => {
                    const facultyId = getFacultyNodeId(faculty.id);
                    const hasPrograms = faculty.programs.length > 0;
                    const isExpanded = expandedNodes.has(facultyId);

                    return (
                      <div
                        key={facultyId}
                        className="rounded-2xl border border-border/60 bg-background/40 p-4 shadow-sm"
                      >
                        <TreeNodeRow
                          label={faculty.name}
                          info={<span className="text-sm text-muted-foreground">{faculty.code}</span>}
                          expandable={hasPrograms}
                          expanded={isExpanded}
                          onToggle={hasPrograms ? () => toggleNode(facultyId) : undefined}
                          onSelect={() => handleTreeFacultyClick(faculty)}
                          isSelected={
                            selectedFacultyId === faculty.id ||
                            (selectedProgramId !== null && selectedFacultyId === faculty.id) ||
                            (selectedCourseId !== null && selectedFacultyId === faculty.id) ||
                            (selectedGroupId !== null && selectedFacultyId === faculty.id)
                          }
                        />
                        {isExpanded && hasPrograms ? (
                          <div className="mt-3 space-y-2 border-l border-border/30 pl-4">
                            {faculty.programs.map((program: ProgramNode) => renderProgram(faculty, program))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Структура пока пуста. Добавьте первый факультет, чтобы начать.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur">
          <CardHeader>
            <CardTitle>Текущий выбор</CardTitle>
            <CardDescription>Используйте выпадающие списки для точного выбора контекста.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SearchableDropdown
              label="Факультет"
              value={selectedFacultyId}
              options={facultyOptions}
              onChange={handleFacultyDropdownChange}
              placeholder="Выберите факультет"
            />
            <SearchableDropdown
              label="Программа"
              value={selectedProgramId}
              options={programOptions}
              onChange={handleProgramDropdownChange}
              placeholder="Выберите программу"
            />
            <SearchableDropdown
              label="Курс"
              value={selectedCourseId}
              options={courseOptions}
              onChange={handleCourseDropdownChange}
              placeholder="Выберите курс"
            />
            <SearchableDropdown
              label="Группа"
              value={selectedGroupId}
              options={groupOptions}
              onChange={handleGroupDropdownChange}
              placeholder="Выберите группу"
            />

            <div className="rounded-xl border border-border/60 bg-background/40 p-3 text-sm text-muted-foreground">
              <p>
                Факультет: <strong>{selectedFaculty?.name ?? '—'}</strong>
              </p>
              <p>
                Программа: <strong>{selectedProgram?.name ?? '—'}</strong>
              </p>
              <p>
                Курс: <strong>{selectedCourse ? `#${selectedCourse.courseNumber}` : '—'}</strong>
              </p>
              <p>
                Группа:{' '}
                <strong>
                  {selectedGroup ? `${selectedGroup.label} (${selectedGroup.type})` : '—'}
                </strong>
              </p>
            </div>
            <Button variant="secondary" onClick={handleResetSelection}>
              Сбросить выбор
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="bg-card/60 backdrop-blur">
          <CardHeader>
            <CardTitle>Добавить факультет</CardTitle>
            <CardDescription>Создайте корневой элемент для программ.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleCreateFaculty}>
              <div className="space-y-2">
                <Label htmlFor="faculty-name">
                  Название <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="faculty-name"
                  placeholder="Факультет информатики"
                  value={facultyName}
                  onChange={(event) => setFacultyName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="faculty-code">
                  Код <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="faculty-code"
                  placeholder="CS"
                  value={facultyCode}
                  onChange={(event) => setFacultyCode(event.target.value)}
                />
              </div>
              <Button
                type="submit"
                isLoading={isFacultySubmitting}
                disabled={!isFacultyFormValid || isFacultySubmitting}
                className="w-full"
                title={
                  !isFacultyFormValid && facultyValidationErrors.length > 0
                    ? `Для сохранения необходимо заполнить:\n${facultyValidationErrors.join('\n')}`
                    : undefined
                }
              >
                Создать факультет
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur">
          <CardHeader>
            <CardTitle>Добавить программу</CardTitle>
            <CardDescription>Программы привязываются к выбранному факультету.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleCreateProgram}>
              <div>
                <SearchableDropdown
                  label="Факультет"
                  value={selectedFacultyId}
                  options={facultyOptions}
                  onChange={handleFacultyDropdownChange}
                  placeholder="Выберите факультет"
                />
                <span className="text-xs text-destructive ml-2">*</span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="program-name">
                  Название программы <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="program-name"
                  placeholder="Программная инженерия"
                  value={programName}
                  onChange={(event) => setProgramName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Уровень <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={programDegree}
                  onChange={(event) => setProgramDegree(event.target.value as DegreeLevel)}
                >
                  {DEGREE_LEVEL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
              <Button
                type="submit"
                isLoading={isProgramSubmitting}
                disabled={!isProgramFormValid || isProgramSubmitting}
                className="w-full"
                title={
                  !isProgramFormValid && programValidationErrors.length > 0
                    ? `Для сохранения необходимо заполнить:\n${programValidationErrors.join('\n')}`
                    : undefined
                }
              >
                Добавить программу
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur">
          <CardHeader>
            <CardTitle>Добавить курс</CardTitle>
            <CardDescription>Создайте учебный год/ступень внутри программы.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleCreateCourse}>
              <div>
                <SearchableDropdown
                  label="Программа"
                  value={selectedProgramId}
                  options={programOptions}
                  onChange={handleProgramDropdownChange}
                  placeholder="Выберите программу"
                />
                <span className="text-xs text-destructive ml-2">*</span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="course-number">
                    Номер курса <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="course-number"
                    type="number"
                    min={1}
                    max={6}
                    value={courseNumber}
                    onChange={(event) => setCourseNumber(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="course-ects">ECTS (опционально)</Label>
                  <Input
                    id="course-ects"
                    type="number"
                    min={0}
                    value={courseEcts}
                    onChange={(event) => setCourseEcts(event.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="course-title">
                  Описание/название <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="course-title"
                  placeholder="Базовая подготовка"
                  value={courseTitle}
                  onChange={(event) => setCourseTitle(event.target.value)}
                />
              </div>
              <Button
                type="submit"
                isLoading={isCourseSubmitting}
                disabled={!isCourseFormValid || isCourseSubmitting}
                className="w-full"
                title={
                  !isCourseFormValid && courseValidationErrors.length > 0
                    ? `Для сохранения необходимо заполнить:\n${courseValidationErrors.join('\n')}`
                    : undefined
                }
              >
                Добавить курс
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur xl:col-span-2">
          <CardHeader>
            <CardTitle>Создать группу</CardTitle>
            <CardDescription>
              Группы создаются внутри курса. Можно указать дополнительную мета-информацию.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleCreateGroup}>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <SearchableDropdown
                    label="Факультет"
                    value={selectedFacultyId}
                    options={facultyOptions}
                    onChange={handleFacultyDropdownChange}
                    placeholder="Факультет"
                  />
                </div>
                <div className="space-y-2">
                  <SearchableDropdown
                    label="Программа"
                    value={selectedProgramId}
                    options={programOptions}
                    onChange={handleProgramDropdownChange}
                    placeholder="Программа"
                  />
                </div>
                <div className="space-y-2">
                  <SearchableDropdown
                    label="Курс"
                    value={selectedCourseId}
                    options={courseOptions}
                    onChange={handleCourseDropdownChange}
                    placeholder="Курс"
                  />
                  <span className="text-xs text-destructive ml-2">*</span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="group-label">
                    Название группы <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="group-label"
                    placeholder="ПИ-311"
                    value={groupLabel}
                    onChange={(event) => setGroupLabel(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    Тип группы <span className="text-destructive">*</span>
                  </Label>
                  <Select value={groupType} onChange={(event) => setGroupType(event.target.value as GroupType)}>
                    {GROUP_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="group-capacity">Вместимость</Label>
                  <Input
                    id="group-capacity"
                    type="number"
                    min={1}
                    value={groupCapacity}
                    onChange={(event) => setGroupCapacity(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Разрешить основной статус</Label>
                  <Select value={groupPrimaryAllowed} onChange={(event) => setGroupPrimaryAllowed(event.target.value as 'true' | 'false')}>
                    <option value="true">Да</option>
                    <option value="false">Нет</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Мета-данные</Label>
                  <Select
                    value={customMetaMode}
                    onChange={(event) => setCustomMetaMode(event.target.value as CustomMetaMode)}
                  >
                    <option value="disabled">Без мета</option>
                    <option value="enabled">Добавить</option>
                  </Select>
                </div>
              </div>

              {customMetaMode === 'enabled' ? (
                <div className="rounded-2xl border border-border/50 bg-background/40 p-4 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="meta-user-id">ID создателя (необяз.)</Label>
                      <Input
                        id="meta-user-id"
                        type="number"
                        min={1}
                        placeholder="123"
                        value={customMetaUserId}
                        onChange={(event) => setCustomMetaUserId(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Роль</Label>
                      <Select
                        value={customMetaRole}
                        onChange={(event) => setCustomMetaRole(event.target.value as CustomGroupCreatorRole)}
                      >
                        {CREATOR_ROLE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Видимость</Label>
                      <Select
                        value={customMetaVisibility}
                        onChange={(event) => setCustomMetaVisibility(event.target.value as CustomGroupVisibility)}
                      >
                        {VISIBILITY_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Модерация</Label>
                      <Select
                        value={customMetaModeration}
                        onChange={(event) =>
                          setCustomMetaModeration(event.target.value as CustomGroupModerationStatus)
                        }
                      >
                        {MODERATION_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                </div>
              ) : null}

              <Button
                type="submit"
                isLoading={isGroupSubmitting}
                disabled={!isGroupFormValid || isGroupSubmitting}
                className="w-full"
                title={
                  !isGroupFormValid && groupValidationErrors.length > 0
                    ? `Для сохранения необходимо заполнить:\n${groupValidationErrors.join('\n')}`
                    : undefined
                }
              >
                Создать группу
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur xl:col-span-2">
          <CardHeader>
            <CardTitle>Добавить участника в группу</CardTitle>
            <CardDescription>Доступно только после выбора конкретной группы.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleAddMember}>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <SearchableDropdown
                    label={
                      <>
                        Группа <span className="text-destructive">*</span>
                      </>
                    }
                    value={selectedGroupId}
                    options={groupOptions}
                    onChange={handleGroupDropdownChange}
                    placeholder="Выберите группу"
                    disabled={false}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    Тип членства <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={memberType}
                    onChange={(event) => setMemberType(event.target.value as GroupMembershipType)}
                  >
                    {MEMBERSHIP_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="member-student-id">
                  ID студента <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="member-student-id"
                  type="number"
                  min={1}
                  placeholder="Например, 10234"
                  value={memberStudentId}
                  onChange={(event) => setMemberStudentId(event.target.value)}
                />
              </div>
              <Button
                type="submit"
                isLoading={isMemberSubmitting}
                disabled={!isMemberFormValid || isMemberSubmitting}
                className="w-full"
                title={
                  !isMemberFormValid && memberValidationErrors.length > 0
                    ? `Для сохранения необходимо заполнить:\n${memberValidationErrors.join('\n')}`
                    : undefined
                }
              >
                Добавить в группу
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

type TreeNodeRowProps = {
  label: string;
  info?: ReactNode;
  expandable?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  onSelect?: () => void;
  isSelected?: boolean;
};

function TreeNodeRow({
  label,
  info,
  expandable,
  expanded,
  onToggle,
  onSelect,
  isSelected,
}: TreeNodeRowProps) {
  return (
    <div className="flex items-center gap-2">
      {expandable ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggle?.();
          }}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition hover:border-primary hover:text-primary hover:bg-primary/5"
          aria-label={expanded ? 'Свернуть ветку' : 'Развернуть ветку'}
        >
          {expanded ? (
            <ChevronDownIcon size={20} className="text-current" />
          ) : (
            <ChevronRightIcon size={20} className="text-current" />
          )}
        </button>
      ) : (
        <span className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground">
          <ChevronRightIcon size={20} className="text-current opacity-50" />
        </span>
      )}
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          'flex-1 rounded-xl px-3 py-1.5 text-left text-sm font-medium transition-colors',
          isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-accent/20 text-foreground',
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <span>{label}</span>
          {info ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">{info}</div>
          ) : null}
        </div>
      </button>
    </div>
  );
}

type SummaryStatProps = {
  title: string;
  value: number;
  hint?: string;
};

function SummaryStat({ title, value, hint }: SummaryStatProps) {
  return (
    <Card className="bg-card/60 backdrop-blur">
      <CardHeader>
        <CardDescription className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          {title}
        </CardDescription>
        <CardTitle className="text-3xl font-semibold text-foreground">{value}</CardTitle>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </CardHeader>
    </Card>
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
