import type { Skill, StudentProject } from '@entities/student-project';

export type ProjectAction = (project: StudentProject) => void;

export type UpdateProjectHandler = (
  projectId: string,
  title: string,
  description: string,
  existingSkills: ReadonlyArray<Skill>,
  newSkills: ReadonlyArray<{ id: string; name: string }>,
) => void;

export type ParticipantHandler = (projectId: string, participantId: string) => void;

export type ParticipantRoleHandler = (
  projectId: string,
  participantId: string,
  roleIdOrName: string,
) => void;

export type SubmitProjectHandler = (
  title: string,
  description: string,
  existingSkills: ReadonlyArray<Skill>,
  newSkills: ReadonlyArray<{ id: string; name: string }>,
  eventId: string | null,
) => void;

export type RoleSelectHandler = (roleIdOrName: string) => void;

