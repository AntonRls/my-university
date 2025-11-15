/* eslint-env browser */
import type { HTMLAttributes } from 'react';

import { cn } from '@shared/utils/className';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card/70 text-card-foreground shadow-lg shadow-black/20 backdrop-blur supports-[backdrop-filter]:bg-card/60',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex flex-col gap-1.5 p-6 pb-3', className)} {...props} />
  );
}

export function CardTitle({
  className,
  ...props
}: HTMLAttributes<globalThis.HTMLHeadingElement>) {
  return <h3 className={cn('text-lg font-semibold tracking-tight', className)} {...props} />;
}

export function CardDescription({
  className,
  ...props
}: HTMLAttributes<globalThis.HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-muted-foreground', className)} {...props} />
  );
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6 pt-0', className)} {...props} />;
}


