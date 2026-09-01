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
  primary: [
    'border-transparent bg-emerald-600 text-white',
    'hover:enabled:bg-emerald-700',
    'focus-visible:ring-emerald-500',
    'active:enabled:bg-emerald-800',
  ].join(' '),
  secondary: [
    'border-transparent bg-slate-600 text-white',
    'hover:enabled:bg-slate-700',
    'focus-visible:ring-slate-500',
    'active:enabled:bg-slate-800',
  ].join(' '),
  tertiary: [
    'border-transparent bg-amber-500 text-white',
    'hover:enabled:bg-amber-600',
    'focus-visible:ring-amber-500',
    'active:enabled:bg-amber-700',
  ].join(' '),
  danger: [
    'border-transparent bg-red-600 text-white',
    'hover:enabled:bg-red-700',
    'focus-visible:ring-red-500',
    'active:enabled:bg-red-800',
  ].join(' '),
  transparent: [
    'border-slate-300 bg-white text-slate-700',
    'hover:enabled:border-slate-400 hover:enabled:bg-slate-50',
    'focus-visible:ring-slate-400',
    'active:enabled:bg-slate-100',
  ].join(' '),
  options: [
    'border-slate-200 bg-white text-slate-600 shadow-none',
    'hover:enabled:border-emerald-300 hover:enabled:bg-emerald-50/50',
    'focus-visible:ring-emerald-500',
    '[&.selected]:enabled:border-emerald-500',
    '[&.selected]:enabled:bg-emerald-50',
    '[&.selected]:enabled:text-emerald-700',
    '[&.selected]:enabled:shadow-sm',
  ].join(' '),
  navbar: [
    'border-transparent bg-transparent text-white shadow-none',
    'hover:enabled:text-emerald-400',
    'focus-visible:ring-emerald-400',
    'active:enabled:text-emerald-500',
  ].join(' '),
  unstyled: '',
};

const sizeClasses: Record<ButtonSize, string> = {
  normal: 'px-4 py-2.5 text-sm',
  small: 'px-3 py-2 text-sm',
  tiny: 'gap-1 px-2.5 py-1.5 text-xs',
  large: 'px-5 py-3 text-base',
};

const baseClasses = [
  'inline-flex w-auto items-center justify-center rounded-lg border',
  'font-semibold leading-normal shadow-sm',
  'cursor-pointer select-none transition-all duration-200',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
  'disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none',
  'disabled:transform-none',
].join(' ');

const animatedClasses = [
  'hover:enabled:-translate-y-px hover:enabled:shadow-md',
  'active:enabled:translate-y-0',
].join(' ');

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
            isStyled && baseClasses,
            isStyled && variant !== 'navbar' && animatedClasses,
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
