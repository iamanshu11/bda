import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const base =
  'w-full rounded-md border bg-background px-4 py-2.5 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-navy-500';

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

/** Labeled text input with error state — reused across auth & dashboard forms. */
export const Field = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div>
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(base, error ? 'border-red-500' : 'border-border', className)}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  },
);
Field.displayName = 'Field';
