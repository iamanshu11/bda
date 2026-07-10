import Link from 'next/link';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 font-semibold tracking-wide uppercase transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-navy-500 disabled:opacity-60 disabled:pointer-events-none';

const variants: Record<Variant, string> = {
  primary: 'bg-rust-500 text-white hover:bg-rust-600 shadow-sm hover:shadow-md',
  secondary: 'bg-navy-700 text-white hover:bg-navy-800 shadow-sm hover:shadow-md',
  outline: 'border-2 border-navy-600 text-navy-600 hover:bg-navy-600 hover:text-white dark:border-navy-300 dark:text-navy-100',
  ghost: 'text-foreground hover:bg-surface-alt',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-xs rounded-md',
  md: 'h-11 px-6 text-sm rounded-md',
  lg: 'h-14 px-8 text-base rounded-md',
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}

type ButtonAsButton = CommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type ButtonAsLink = CommonProps & {
  href: string;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>;

export function Button(props: ButtonAsButton | ButtonAsLink) {
  const { variant = 'primary', size = 'md', className, children } = props;
  const classes = cn(base, variants[variant], sizes[size], className);

  if ('href' in props && props.href) {
    const { href, ...rest } = props as ButtonAsLink;
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  const { variant: _v, size: _s, className: _c, children: _ch, ...rest } =
    props as ButtonAsButton;
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
