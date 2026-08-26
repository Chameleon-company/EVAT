import { XIcon } from 'lucide-react';
import { forwardRef, type ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

type BannerProps = {
  type?: 'error' | 'info' | 'warning';
  children?: ReactNode;
  dismissable?: boolean;
  onDismiss?: () => void;
};

export const Banner = forwardRef<HTMLDivElement, BannerProps>(
  ({ type = 'info', children, className, dismissable = true, onDismiss, ...props }, ref) => {
    const bgColors: Record<NonNullable<BannerProps['type']>, string> = {
      info: 'bg-gray-900', // TODO
      error: 'bg-error',
      warning: 'bg-warning'
    };

    return (
      <>
        <div className="pointer-events-none sm:flex sm:justify-center sm:px-6 sm:pb-5 lg:px-8">
          <div
            ref={ref}
            className={twMerge(
              'pointer-events-auto flex items-center justify-between gap-x-6 bg-gray-900 px-6 py-2.5 sm:rounded-xl sm:py-3 sm:pr-3.5 sm:pl-4',
              bgColors[type],
              className,
            )}
            {...props}
          >
            <p className="text-sm/6 text-white">
              {children}
            </p>
            { dismissable && 
              <button
                type="button"
                className="-m-1.5 flex-none p-1.5"
                onClick={onDismiss}
              >
                <span className="sr-only">Dismiss</span>
                <XIcon aria-hidden="true" className="size-5 text-white" />
              </button>
            }
          </div>
        </div>
      </>
    );
  }
);

Banner.displayName = 'Banner';