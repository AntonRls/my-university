import type { SelectHTMLAttributes } from 'react';
import { forwardRef } from 'react';

import { cn } from '@shared/utils/className';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          'flex h-11 w-full appearance-none rounded-xl border border-border bg-transparent px-4 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground">
        ▾
      </span>
    </div>
  ),
);

Select.displayName = 'Select';


