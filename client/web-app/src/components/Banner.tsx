import { XIcon } from 'lucide-react';
import { forwardRef, type ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

type BannerProps = {
  type?: 'error' | 'info' | 'warning';
  variant?: 'outline' | 'solid';
  children?: ReactNode;
  onDismiss?: () => void;
};

export const Banner = forwardRef<HTMLDivElement, BannerProps>(
  ({ type = 'info', variant = 'solid', children, className, dismissable = true, onDismiss, ...props }, ref) => {
    const bgColors: Record<NonNullable<BannerProps['variant']>, Record<NonNullable<BannerProps['type']>, string>> = {
      outline: {
        info: 'outline-surface-50',
        error: 'outline-error',
        warning: 'outline-warning'
      },
      solid: {
        info: 'bg-surface-50',
        error: 'bg-error text-white',
        warning: 'bg-warning'
      }
    };

    return (
      <>
        <div
          ref={ref}
          className={twMerge(
            'pointer-events-auto flex items-center justify-between gap-x-6 px-6 py-2.5 rounded-md sm:rounded-xl sm:py-3 sm:pr-3.5 sm:pl-4',
            variant === 'outline' && 'outline-1',
            bgColors[variant][type],
            className,
          )}
          {...props}
        >
          <div className="text-sm/6">
            {children}
          </div>
          { onDismiss && 
            <button
              type="button"
              className="-m-1.5 flex-none p-1.5"
              onClick={onDismiss}
            >
              <span className="sr-only">Dismiss</span>
              <XIcon aria-hidden="true" className="size-5 text-inherit" />
            </button>
          }
        </div>
      </>
    );
  }
);

Banner.displayName = 'Banner';