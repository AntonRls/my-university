/* eslint-env browser */
import type { TextareaHTMLAttributes } from 'react';
import { forwardRef } from 'react';

import { cn } from '@shared/utils/className';

type TextareaProps = TextareaHTMLAttributes<globalThis.HTMLTextAreaElement>;

export const Textarea = forwardRef<globalThis.HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        'flex w-full rounded-xl border border-border bg-transparent px-4 py-2 text-base transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'min-h-[120px] resize-none',
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);

Textarea.displayName = 'Textarea';


