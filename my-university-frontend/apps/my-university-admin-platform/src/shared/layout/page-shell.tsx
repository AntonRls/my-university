import type { ReactNode } from 'react';

import { cn } from '@shared/utils/className';

type PageShellProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function PageShell({ title, description, actions, children, className }: PageShellProps) {
  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1.5">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">My University</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {title}
          </h1>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>

      <div>{children}</div>
    </div>
  );
}


