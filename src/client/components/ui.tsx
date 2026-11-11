import * as React from 'react';
import { cloneElement, isValidElement, useId } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../lib/utils';

// Button
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'destructive' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'default', size = 'default', loading, disabled, children, ...props },
    ref
  ) => {
    const base =
      'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-50';
    const variants = {
      default: 'bg-zinc-100 text-zinc-900 shadow hover:bg-zinc-200',
      primary:
        'bg-violet-600 text-white shadow-lg shadow-violet-600/25 hover:bg-violet-500 hover:shadow-violet-500/30 focus-visible:ring-violet-400',
      destructive:
        'bg-red-600 text-white shadow-lg shadow-red-600/25 hover:bg-red-500 hover:shadow-red-500/30',
      outline: 'bg-zinc-800 text-zinc-100 shadow-sm hover:bg-zinc-700',
      ghost: 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100',
      link: 'text-zinc-100 underline-offset-4 hover:underline',
    };
    const sizes = {
      default: 'h-9 px-4 py-2 text-sm',
      sm: 'h-7 px-3 text-xs',
      lg: 'h-10 px-6 text-base',
      icon: 'h-9 w-9',
    };
    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

// Input
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-lg border border-zinc-700/80 bg-zinc-900/80 px-3.5 text-sm text-zinc-100 shadow-sm shadow-black/20 placeholder:text-zinc-600',
        'transition-[border-color,box-shadow] hover:border-zinc-600 motion-reduce:transition-none',
        'focus-visible:outline-none focus-visible:border-violet-500/60 focus-visible:ring-2 focus-visible:ring-violet-500/20',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';

// Textarea
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex w-full rounded-lg border border-zinc-700/80 bg-zinc-900/80 px-3.5 py-2.5 text-sm text-zinc-100 shadow-sm shadow-black/20 placeholder:text-zinc-600',
        'transition-[border-color,box-shadow] hover:border-zinc-600 motion-reduce:transition-none',
        'focus-visible:outline-none focus-visible:border-violet-500/60 focus-visible:ring-2 focus-visible:ring-violet-500/20',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

// Label
export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn('text-sm font-medium text-zinc-300 leading-none', className)}
    {...props}
  />
));
Label.displayName = 'Label';

// Select (Native - for forms)
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-lg border border-zinc-700/80 bg-zinc-900/80 px-3.5 text-sm text-zinc-100 shadow-sm shadow-black/20',
        'transition-[border-color,box-shadow] hover:border-zinc-600 motion-reduce:transition-none',
        'focus-visible:outline-none focus-visible:border-violet-500/60 focus-visible:ring-2 focus-visible:ring-violet-500/20',
        'disabled:cursor-not-allowed disabled:opacity-50',
        '[&>option]:bg-zinc-900 [&>option]:text-zinc-100',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = 'Select';

// Custom Select (Dropdown style)
interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  /** Forwarded to the trigger button so <label htmlFor> can point here. */
  id?: string;
}

export const CustomSelect = ({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  className,
  id,
}: CustomSelectProps) => {
  const [open, setOpen] = React.useState(false);
  const selectedOption = options.find(opt => opt.value === value);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        id={id}
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-lg border border-zinc-700/80 bg-zinc-900/80 px-3.5 text-sm shadow-sm shadow-black/20',
          'transition-[border-color,box-shadow] hover:border-zinc-600 motion-reduce:transition-none',
          'focus-visible:outline-none focus-visible:border-violet-500/60 focus-visible:ring-2 focus-visible:ring-violet-500/20',
          open ? 'border-violet-500/60 ring-2 ring-violet-500/20' : ''
        )}
      >
        <span className={selectedOption ? 'text-zinc-100' : 'text-zinc-500'}>
          {selectedOption?.label ?? placeholder}
        </span>
        <svg
          aria-hidden="true"
          className={cn('h-4 w-4 text-zinc-500 transition-transform', open ? 'rotate-180' : '')}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute z-50 mt-1.5 w-full rounded-lg border border-zinc-700/80 bg-zinc-900 shadow-2xl shadow-black/50 animate-fade-in"
        >
          <div className="max-h-60 overflow-auto p-1">
            {options.map(option => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={value === option.value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm rounded-md transition-colors',
                  value === option.value
                    ? 'bg-violet-600 text-white'
                    : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-zinc-100'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Card
export const Card = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'rounded-lg border border-zinc-800 bg-zinc-900/50 text-zinc-100 shadow-sm',
      className
    )}
    {...props}
  />
);
export const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1 p-5', className)} {...props} />
);
export const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn('text-base font-semibold leading-none tracking-tight', className)} {...props} />
);
export const CardDescription = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn('text-sm text-zinc-500', className)} {...props} />
);
export const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-5 pt-0', className)} {...props} />
);
export const CardFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center p-5 pt-0', className)} {...props} />
);

// Badge
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline';
}
export const Badge = ({ className, variant = 'default', ...props }: BadgeProps) => {
  const variants = {
    default: 'bg-zinc-700 text-zinc-100',
    secondary: 'bg-zinc-800 text-zinc-400',
    outline: 'border border-zinc-700 text-zinc-400',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    />
  );
};

// Separator
export const Separator = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('shrink-0 bg-zinc-800 h-px w-full', className)} {...props} />
);

// Dialog / Modal
interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}
export const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  // Close on Escape
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  // Lock background scroll while open.
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Portal to <body>: page containers carry entrance-animation transforms,
  // which would trap `fixed` inside their (scrollable) box instead of the viewport.
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center sm:p-6">
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 max-h-full w-full max-w-md overflow-y-auto overscroll-contain motion-safe:animate-rise"
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

export const DialogContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/60 ring-1 ring-white/10 backdrop-blur-xl p-6',
      className
    )}
    {...props}
  />
);
interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional leading icon, rendered in a tinted tile (tone picks the color). */
  icon?: React.ReactNode;
  tone?: 'violet' | 'danger';
}
const headerTiles = {
  violet: 'border-violet-500/20 bg-violet-600/15 text-violet-400',
  danger: 'border-red-500/20 bg-red-600/15 text-red-400',
};
const headerWash = {
  violet: 'from-violet-600/10',
  danger: 'from-red-600/10',
};
export const DialogHeader = ({
  icon,
  tone = 'violet',
  className,
  children,
  ...props
}: DialogHeaderProps) => (
  <div
    className={cn(
      '-mx-6 -mt-6 mb-4 flex items-center gap-3 border-b border-zinc-800/80 bg-gradient-to-b to-transparent px-6 pb-3 pt-3.5',
      headerWash[tone],
      className
    )}
    {...props}
  >
    {icon && (
      <div
        aria-hidden="true"
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border',
          headerTiles[tone]
        )}
      >
        {icon}
      </div>
    )}
    <div className="min-w-0 space-y-1">{children}</div>
  </div>
);
export const DialogTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2
    className={cn('text-base font-semibold tracking-tight text-zinc-100', className)}
    {...props}
  />
);
export const DialogDescription = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn('text-sm leading-relaxed text-zinc-500', className)} {...props} />
);
export const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      '-mx-6 -mb-6 mt-5 flex items-center justify-end gap-2.5 border-t border-zinc-800/80 bg-zinc-900/40 px-6 py-3.5',
      className
    )}
    {...props}
  />
);

// FormField helper
interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
}
export const FormField = ({ label, error, children, required }: FormFieldProps) => {
  const id = useId();
  const errorId = `${id}-error`;
  const control = isValidElement(children)
    ? cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': error ? errorId : undefined,
        'aria-required': required || undefined,
      })
    : children;
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-[13px] font-medium text-zinc-400">
        {label}
        {required && (
          <span className="text-violet-400/80 ml-1" aria-hidden="true">
            *
          </span>
        )}
      </Label>
      {control}
      {error && (
        <p id={errorId} className="text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
};

// Alert
interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive';
}
export const Alert = ({ className, variant = 'default', ...props }: AlertProps) => {
  const variants = {
    default: 'border-zinc-700 bg-zinc-800/50 text-zinc-300',
    destructive: 'border-red-800 bg-red-950/50 text-red-400',
  };
  return (
    <div
      role={variant === 'destructive' ? 'alert' : 'status'}
      className={cn('rounded-md border p-3 text-sm', variants[variant], className)}
      {...props}
    />
  );
};

// Tooltip (simple hover)
interface TooltipProps {
  content: string;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
}
export const Tooltip = ({ content, children, side = 'top' }: TooltipProps) => {
  const positions = {
    top: 'bottom-full left-1/2 mb-1.5 -translate-x-1/2',
    right: 'left-full top-1/2 ml-1.5 -translate-y-1/2',
    bottom: 'top-full left-1/2 mt-1.5 -translate-x-1/2',
    left: 'right-full top-1/2 mr-1.5 -translate-y-1/2',
  };
  return (
    <div className="group relative inline-flex">
      {children}
      <span
        className={cn(
          'pointer-events-none absolute whitespace-nowrap rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-200 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 z-50',
          positions[side]
        )}
      >
        {content}
      </span>
    </div>
  );
};
