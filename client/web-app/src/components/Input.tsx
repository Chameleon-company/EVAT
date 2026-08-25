import { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

type InputProps = React.ComponentProps<'input'>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={twMerge(
        'block w-full rounded-md bg-white px-3 py-1.5',
        'text-base text-gray-900',
        'outline-1 -outline-offset-1 outline-gray-300',
        'placeholder:text-gray-400',
        'focus:outline-2 focus:-outline-offset-2',
        'focus:outline-indigo-600 sm:text-sm/6',
        className,
      )}
      {...props}
    />
  )
);

Input.displayName = 'Input';