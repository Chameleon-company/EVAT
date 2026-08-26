import { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

type InputProps = React.ComponentProps<'input'> & {
  hasError?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, hasError = false, ...props }, ref) => (
    <input
      ref={ref}
      className={twMerge(
        'block w-full rounded-md bg-white px-3 py-1.5',
        'text-base text-foreground',
        'outline-1 -outline-offset-1 outline-surface-300',
        'placeholder:text-surface-400',
        'focus:outline-2 focus:-outline-offset-2',
        'focus:outline-indigo-600 sm:text-sm/6',
        'dark:bg-background',
        'invalid:outline-danger invalid:focus:outline-danger',
        hasError && 'outline-danger focus:outline-danger',
        className,
      )}
      {...props}
    />
  )
);

Input.displayName = 'Input';