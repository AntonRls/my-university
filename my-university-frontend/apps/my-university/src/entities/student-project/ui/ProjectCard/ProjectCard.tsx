import { useCallback, useMemo } from 'react';
import { Typography, Button } from '@maxhub/max-ui';

import type { StudentProject } from '@entities/student-project';
import { sanitizeHtml, hasRichTextContent } from '@shared/utils/rich-text';
import { cn } from '@shared/utils/className';

import styles from './ProjectCard.module.scss';

const VISIBLE_SKILLS_LIMIT = 3;

type ProjectCardProps = {
  project: StudentProject;
  isOwnProject?: boolean;
  isApprovedParticipant?: boolean;
  onRequestJoin?: (project: StudentProject) => void;
  onManage?: (project: StudentProject) => void;
  onClick?: (project: StudentProject) => void;
  isProcessing?: boolean;
};

export function ProjectCard({
  project: projectData,
  isOwnProject = false,
  isApprovedParticipant = false,
  onRequestJoin,
  onManage,
  onClick,
  isProcessing = false,
}: ProjectCardProps) {
  const project = projectData;
  const approvedParticipants = project.participants.filter((p) => p.status === 'approved');
  const pendingParticipants = project.participants.filter((p) => p.status === 'pending');
  const participantsCount = approvedParticipants.length;
  const normalizedSkillNames = project.skills
    .map((skill) => skill.name.trim())
    .filter((name) => name.length > 0);
  const displayedSkillNames = normalizedSkillNames.slice(0, VISIBLE_SKILLS_LIMIT);
  const hasExtraSkills = normalizedSkillNames.length > VISIBLE_SKILLS_LIMIT;
  const skillsToRender = hasExtraSkills ? [...displayedSkillNames, '...'] : displayedSkillNames;
  const shouldShowSkills = displayedSkillNames.length > 0;

  const handleCardClick = useCallback(() => {
    if (onClick) {
      onClick(project);
    }
  }, [onClick, project]);

  const hasDescription = hasRichTextContent(project.description);
  const sanitizedDescription = useMemo(
    () => sanitizeHtml(project.description ?? ''),
    [project.description],
  );

  return (
    <article
      className={styles.card}
      aria-label={project.title}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      <div className={styles.content}>
        <header className={styles.header}>
          <Typography.Title className={styles.title}>{project.title}</Typography.Title>
          {isOwnProject ? (
            <span className={styles.ownerBadge}>Моя команда</span>
          ) : isApprovedParticipant ? (
            <span className={styles.memberBadge}>Вы в команде</span>
          ) : null}
        </header>

        {hasDescription ? (
          <div
            className={cn(styles.description, styles.formattedDescription)}
            dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
          />
        ) : project.description ? (
          <Typography.Body className={styles.description}>{project.description}</Typography.Body>
        ) : null}

        {project.ownerName ? (
          <div className={styles.meta}>
            <span className={styles.metaLabel}>Создатель</span>
            <span className={styles.metaValue}>{project.ownerName}</span>
          </div>
        ) : null}

        <div className={styles.meta}>
          <span className={styles.metaLabel}>Участников</span>
          <span className={styles.metaValue}>
            {participantsCount}
            {isOwnProject && pendingParticipants.length > 0
              ? ` (+${pendingParticipants.length} заявок)`
              : null}
          </span>
        </div>

        {shouldShowSkills ? (
          <div className={styles.skillsBlock}>
            <span className={styles.skillsLabel}>Навыки, которые мы ожидаем:</span>
            <ul className={styles.skillsList}>
              {skillsToRender.map((skillName, index) => (
                <li key={`${skillName}-${index}`} className={styles.skillsListItem}>
                  {skillName}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <footer className={styles.footer} onClick={(e) => e.stopPropagation()}>
        {isOwnProject ? (
          <div className={styles.ownerActions}>
            <Button
              type="button"
              size="medium"
              mode="primary"
              appearance="themed"
              className={styles.actionButton}
              onClick={() => onManage?.(project)}
              disabled={isProcessing}
              aria-busy={isProcessing}
            >
              Управлять
            </Button>
            {pendingParticipants.length > 0 ? (
              <span
                className={styles.pendingBadge}
                aria-label={`Новых заявок: ${pendingParticipants.length}`}
              >
                {pendingParticipants.length}
              </span>
            ) : null}
          </div>
        ) : isApprovedParticipant ? (
          <Typography.Body className={styles.memberStatus}>Вы уже в этой команде</Typography.Body>
        ) : (
          <Button
            type="button"
            size="medium"
            mode="primary"
            appearance="themed"
            className={styles.actionButton}
            onClick={() => onRequestJoin?.(project)}
            disabled={isProcessing}
            aria-busy={isProcessing}
          >
            Подать заявку
          </Button>
        )}
      </footer>
    </article>
  );
}

