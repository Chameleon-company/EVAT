import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'danger'
  | 'transparent'
  | 'options'
  | 'navbar'
  | 'unstyled';

type ButtonSize = 'normal' | 'small' | 'tiny' | 'large';

type ButtonProps = ComponentPropsWithoutRef<'button'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingLabel?: ReactNode;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  tertiary: 'btn-tertiary',
  danger: 'btn-danger',
  transparent: 'btn-transparent',
  options: 'btn-options',
  navbar: 'btn-navbar',
  unstyled: '',
};

const sizeClasses: Record<ButtonSize, string> = {
  normal: '',
  small: 'btn-small',
  tiny: 'btn-tiny',
  large: 'btn-large',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'normal',
      loading = false,
      loadingLabel = 'Loading…',
      disabled = false,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const isStyled = variant !== 'unstyled';

    return (
      <button
        ref={ref}
        className={twMerge(
          clsx(
            isStyled && 'btn',
            isStyled && variantClasses[variant],
            isStyled && sizeClasses[size],
            className,
          ),
        )}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading ? loadingLabel : children}
      </button>
    );
  },
);

Button.displayName = 'Button';
