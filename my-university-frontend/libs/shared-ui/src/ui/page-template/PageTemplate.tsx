import type { ReactNode } from 'react';

import { cn } from '@shared/utils/className';

import styles from './PageTemplate.module.scss';

type PageTemplateProps = {
  title: string | ReadonlyArray<string>;
  actions?: ReactNode;
  className?: string;
  contentClassName?: string;
  children: ReactNode;
};

export function PageTemplate({
  title,
  actions,
  className,
  contentClassName,
  children,
}: PageTemplateProps) {
  const titleLines = Array.isArray(title) ? title : [title];

  return (
    <div className={cn(styles.root, className)}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          {titleLines.map((line, index) => (
            <span key={`${line}-${index}`} className={styles.titleLine}>
              {line}
            </span>
          ))}
        </h1>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </header>

      <div className={cn(styles.content, contentClassName)}>{children}</div>
    </div>
  );
}

