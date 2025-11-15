import type { HTMLAttributes } from 'react';

import { cn } from '@shared/utils/className';

type AvatarProps = HTMLAttributes<HTMLDivElement> & {
  size?: number;
  initials?: string | null;
};

export function Avatar({ size = 48, initials, className, ...props }: AvatarProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full border border-border bg-muted text-sm font-semibold uppercase text-muted-foreground',
        className,
      )}
      style={{ width: size, height: size }}
      {...props}
    >
      {initials ?? '—'}
    </div>
  );
}


