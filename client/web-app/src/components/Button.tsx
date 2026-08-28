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
    '[background:var(--button-primary-background)]',
    'text-[var(--button-primary-text)]',
    '[border:var(--button-primary-border)]',
    'active:enabled:[background:var(--button-primary-background-active)]',
  ].join(' '),
  secondary: [
    '[background:var(--button-secondary-background)]',
    'text-[var(--button-secondary-text)]',
    '[border:var(--button-secondary-border)]',
    'active:enabled:[background:var(--button-secondary-background-active)]',
  ].join(' '),
  tertiary: [
    '[background:var(--button-tertiary-background)]',
    'text-[var(--button-tertiary-text)]',
    '[border:var(--button-tertiary-border)]',
    'active:enabled:[background:var(--button-tertiary-background-active)]',
  ].join(' '),
  danger: [
    '[background:var(--button-danger-background)]',
    'text-[var(--button-danger-text)]',
    '[border:var(--button-danger-border)]',
    'active:enabled:[background:var(--button-danger-background-active)]',
  ].join(' '),
  transparent: [
    '[background:var(--button-transparent-background)]',
    'text-[var(--button-transparent-text)]',
    '[border:var(--button-transparent-border)]',
    'active:enabled:[background:var(--button-transparent-background-active)]',
  ].join(' '),
  options: [
    '[background:var(--button-options-background)]',
    'text-[var(--button-options-text)]',
    '[border:var(--button-options-border)]',
    'active:enabled:[background:var(--button-options-background-active)]',
    '[&.selected]:enabled:[background:var(--button-options-selected-background)]',
    '[&.selected]:enabled:[border:var(--button-options-selected-border)]',
    '[&.selected]:enabled:text-[var(--button-options-selected-text)]',
  ].join(' '),
  navbar: [
    '[background:var(--navbar-button-background)]',
    'text-[var(--navbar-button-text)]',
    '[border:var(--navbar-button-border)]',
    'shadow-[var(--navbar-button-box-shadow)]',
    'text-[length:var(--navbar-font-size)]',
    'hover:enabled:text-[var(--navbar-button-hover-text)]',
    'active:enabled:text-[var(--navbar-button-active-text)]',
    'disabled:text-[var(--navbar-button-disable-text)]',
  ].join(' '),
  unstyled: '',
};

const sizeClasses: Record<ButtonSize, string> = {
  normal: '',
  small: 'p-[var(--button-padding-small)] text-[length:var(--button-font-small)]',
  tiny: 'items-center gap-[5px] p-[var(--button-padding-tiny)] text-[length:var(--button-font-tiny)]',
  large: 'p-[var(--button-padding-large)] text-[length:var(--button-font-large)]',
};

const baseClasses = [
  'inline-flex w-auto justify-center',
  'p-[var(--button-padding)] m-[var(--button-margin)]',
  'text-[length:var(--button-font)] font-[var(--weight-semibold)] leading-[1.5]',
  'rounded-[var(--button-radius)] shadow-[var(--button-shadow)]',
  '[transition:var(--button-transition)]',
  'cursor-pointer select-none [-webkit-tap-highlight-color:transparent]',
  'disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none',
  'disabled:transform-none',
  'disabled:[background:var(--button-disabled-background)]',
  'disabled:text-[var(--button-disabled-text)]',
  'disabled:[border:var(--button-disabled-border)]',
].join(' ');

const animatedClasses = [
  'bg-[length:200%_100%] bg-[position:100%_0%]',
  'hover:enabled:-translate-y-px hover:enabled:shadow-[var(--button-shadow-hover)]',
  'hover:enabled:bg-[position:0%_0%] active:enabled:translate-y-0',
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
