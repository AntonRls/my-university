import type { ButtonHTMLAttributes, ReactElement } from 'react';
import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@shared/utils/className';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 ring-offset-background',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline: 'border border-border bg-transparent hover:bg-accent hover:text-accent-foreground',
        ghost: 'bg-transparent hover:bg-accent hover:text-accent-foreground',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3 text-xs',
        lg: 'h-11 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> &
  VariantProps<typeof buttonVariants> & {
    isLoading?: boolean;
    icon?: ReactElement;
    disabled?: boolean;
  };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading = false, icon, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        buttonVariants({ variant, size }),
        isLoading && 'cursor-progress opacity-80',
        className,
      )}
      disabled={isLoading || disabled}
      {...props}
    >
      {icon ? <span className="inline-flex items-center">{icon}</span> : null}
      <span>{isLoading ? 'Загрузка...' : children}</span>
    </button>
  ),
);

Button.displayName = 'Button';

export type { ButtonProps };
export { buttonVariants };


