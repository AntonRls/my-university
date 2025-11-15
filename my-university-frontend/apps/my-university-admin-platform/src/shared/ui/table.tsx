/* eslint-env browser */
import type { HTMLAttributes, TableHTMLAttributes, ThHTMLAttributes } from 'react';

import { cn } from '@shared/utils/className';

export function Table({
  className,
  ...props
}: TableHTMLAttributes<globalThis.HTMLTableElement>) {
  return (
    <table
      className={cn('w-full border-collapse text-sm text-foreground/90', className)}
      {...props}
    />
  );
}

export function TableHeader({
  className,
  ...props
}: HTMLAttributes<globalThis.HTMLTableSectionElement>) {
  return (
    <thead className={cn('[&_tr]:border-b border-border/80', className)} {...props} />
  );
}

export function TableBody({
  className,
  ...props
}: HTMLAttributes<globalThis.HTMLTableSectionElement>) {
  return (
    <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />
  );
}

export function TableRow({
  className,
  ...props
}: HTMLAttributes<globalThis.HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'border-b border-border/60 transition-colors hover:bg-accent/40 data-[state=selected]:bg-accent',
        className,
      )}
      {...props}
    />
  );
}

export function TableHead({
  className,
  ...props
}: ThHTMLAttributes<globalThis.HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({
  className,
  ...props
}: HTMLAttributes<globalThis.HTMLTableCellElement>) {
  return (
    <td className={cn('px-4 py-3 align-middle text-sm text-foreground/90', className)} {...props} />
  );
}


