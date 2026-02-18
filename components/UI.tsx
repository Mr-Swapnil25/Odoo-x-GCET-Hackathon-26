import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useStore } from '../store';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Theme-aware hook for getting role-based colors
export const useRoleTheme = () => {
  const { currentUser } = useStore();
  const isAdmin = currentUser?.role === 'ADMIN';
  
  return {
    isAdmin,
    // Primary colors
    primary: isAdmin ? '#3B82F6' : '#8B5CF6',
    primaryHover: isAdmin ? '#2563EB' : '#7C3AED',
    primaryLight: isAdmin ? '#60A5FA' : '#A78BFA',
    primaryGlow: isAdmin ? 'rgba(59, 130, 246, 0.25)' : 'rgba(139, 92, 246, 0.25)',
    // Background colors
    cardBg: 'bg-[#111827]/70',
    cardBorder: 'border-white/[0.06]',
    inputBg: 'bg-[#111827]',
    // Text colors
    textMuted: 'text-[#A0AABF]',
    textPlaceholder: 'placeholder:text-[#64748B]',
    // Focus ring
    focusRing: isAdmin ? 'focus:ring-blue-500' : 'focus:ring-violet-500',
    focusOffset: 'focus:ring-offset-[#0A0E1A]',
    // Gradient classes
    gradientFrom: isAdmin ? '#1E3A8A' : '#4C1D95',
    gradientTo: isAdmin ? '#3B82F6' : '#8B5CF6',
  };
};

// Button
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const theme = useRoleTheme();
    
    const variants = {
      primary: theme.isAdmin
        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-600/25'
        : 'bg-violet-600 text-white hover:bg-violet-700 shadow-sm shadow-violet-600/25',
      secondary: 'bg-[#1a2236] text-white hover:bg-[#222d44]',
      outline: cn(
        'border bg-transparent',
        theme.isAdmin
          ? 'border-white/[0.08] hover:bg-blue-500/10 text-[#A0AABF]'
          : 'border-white/[0.08] hover:bg-violet-500/10 text-[#A0AABF]'
      ),
      ghost: cn(
        'hover:bg-white/[0.04]',
        'text-[#A0AABF]'
      ),
      danger: 'bg-red-500 text-white hover:bg-red-600',
    };
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2',
      lg: 'px-6 py-3 text-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-150 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]',
          theme.isAdmin 
            ? 'focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#0A0E1A]'
            : 'focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-[#0A0E1A]',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

// Input
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    const theme = useRoleTheme();
    return (
      <div className="w-full">
        {label && <label className={cn("block text-sm font-medium mb-1.5 text-[#A0AABF]")}>{label}</label>}
        <input
          ref={ref}
          className={cn(
            'flex h-11 w-full rounded-xl border px-4 py-2.5 text-sm text-[#E8E8FF] transition-all duration-150 focus:outline-none focus:ring-2 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50',
            theme.isAdmin
              ? 'border-white/8 bg-[#111827] placeholder:text-[#64748B] focus:ring-blue-500'
              : 'border-white/8 bg-[#111827] placeholder:text-[#64748B] focus:ring-violet-500',
            error && 'border-red-500 focus:ring-red-500',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-red-400">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

// Select
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: { label: string; value: string }[];
  children?: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, children, ...props }, ref) => {
    const theme = useRoleTheme();
    return (
      <div className="w-full">
        {label && <label className={cn("block text-sm font-medium mb-1.5 text-[#A0AABF]")}>{label}</label>}
        <select
          ref={ref}
          className={cn(
            'flex h-11 w-full rounded-xl border px-4 py-2.5 text-sm text-[#E8E8FF] transition-all duration-150 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50',
            theme.isAdmin
              ? 'border-white/8 bg-[#111827] focus:ring-blue-500'
              : 'border-white/8 bg-[#111827] focus:ring-violet-500',
            error && 'border-red-500',
            className
          )}
          {...props}
        >
          {options
            ? options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#111827]">
                {opt.label}
              </option>
            ))
            : children}
        </select>
        {error && <p className="mt-1.5 text-sm text-red-400">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';

// Card - Professional, clean cards with role-based subtle accents
interface CardProps {
  className?: string;
  children?: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
}

export const Card: React.FC<CardProps> = ({ className, children, variant = 'default' }) => {
  const theme = useRoleTheme();
  
  const variants = {
    default: cn(
      'rounded-2xl border backdrop-blur-xl text-white shadow-lg transition-all duration-200',
      'bg-[#111827]/70 border-white/[0.06]',
      'hover:shadow-xl',
      theme.isAdmin ? 'hover:shadow-blue-900/5' : 'hover:shadow-violet-900/5'
    ),
    elevated: cn(
      'rounded-2xl border backdrop-blur-xl text-white shadow-xl transition-all duration-200',
      'bg-[#111827]/80 border-white/[0.08]',
      theme.isAdmin ? 'shadow-blue-900/10' : 'shadow-violet-900/10'
    ),
    outlined: cn(
      'rounded-2xl border-2 text-white transition-all duration-200',
      'bg-transparent border-white/[0.08] hover:border-white/[0.12]'
    ),
  };
  
  return (
    <div className={cn(variants[variant], className)}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{ className?: string; children?: React.ReactNode }> = ({ className, children }) => (
  <div className={cn('flex flex-col space-y-1.5 p-6', className)}>{children}</div>
);

export const CardContent: React.FC<{ className?: string; children?: React.ReactNode }> = ({ className, children }) => (
  <div className={cn('p-6 pt-0', className)}>{children}</div>
);

// Badge with role-based default colors
interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'outline' | 'info';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className }) => {
  const theme = useRoleTheme();
  
  const styles = {
    default: theme.isAdmin 
      ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25'
      : 'bg-violet-500/15 text-violet-400 border border-violet-500/25',
    success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
    warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
    danger: 'bg-red-500/15 text-red-400 border border-red-500/25',
    info: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25',
    outline: 'border border-white/[0.08] text-[#A0AABF]',
  };
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', styles[variant], className)}>
      {children}
    </span>
  );
};

// Avatar with role-based gradient background and initials
interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

// Role-aware gradients plus variety gradients
const adminGradients = [
  'from-blue-500 to-blue-700',
  'from-blue-600 to-indigo-600',
  'from-sky-500 to-blue-600',
  'from-indigo-500 to-blue-600',
];

const userGradients = [
  'from-violet-500 to-violet-700',
  'from-violet-500 to-purple-600',
  'from-fuchsia-500 to-violet-600',
  'from-purple-600 to-indigo-500',
];

export const Avatar: React.FC<AvatarProps> = ({ name, size = 'md', className }) => {
  const theme = useRoleTheme();
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  // Deterministic gradient based on name
  const gradients = theme.isAdmin ? adminGradients : userGradients;
  const gradientIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % gradients.length;
  
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-20 h-20 text-2xl',
  };
  
  return (
    <div className={cn(
      `rounded-full bg-linear-to-br ${gradients[gradientIndex]} flex items-center justify-center text-white font-bold shadow-md`,
      sizes[size],
      className
    )}>
      {initials}
    </div>
  );
};

// Modal with role-based theming
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const theme = useRoleTheme();
  
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };
  
  if (!isOpen) return null;
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={cn(
        "w-full rounded-2xl border shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col",
        sizes[size],
        'bg-[#111827] border-white/8',
        theme.isAdmin ? 'shadow-blue-900/10' : 'shadow-violet-900/10'
      )}>
        <div className={cn(
          "flex items-center justify-between border-b p-5 shrink-0",
          "border-white/6"
        )}>
          <h3 className="text-lg font-semibold text-[#E8E8FF]">{title}</h3>
          <button 
            onClick={onClose} 
            className="p-2 rounded-lg transition-colors text-[#A0AABF] hover:text-white hover:bg-white/5"
          >
            x
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};

// Stat Card - Professional stat display component
interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, className }) => {
  const theme = useRoleTheme();
  
  return (
    <Card variant="elevated" className={cn("p-6", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className={cn("text-sm font-medium text-[#A0AABF]")}>{title}</p>
          <p className="text-3xl font-bold text-[#E8E8FF] tracking-tight">{value}</p>
          {trend && (
            <p className={cn(
              "text-sm font-medium flex items-center gap-1",
              trend.isPositive ? "text-emerald-400" : "text-red-400"
            )}>
              {trend.isPositive ? '+' : '-'} {Math.abs(trend.value)}%
              <span className="font-normal text-[#A0AABF]">vs last month</span>
            </p>
          )}
        </div>
        {icon && (
          <div className={cn(
            "p-3 rounded-xl",
            theme.isAdmin 
              ? "bg-blue-500/10 text-blue-400"
              : "bg-violet-500/10 text-violet-400"
          )}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

// Table components with role-based theming
export const Table: React.FC<{ className?: string; children?: React.ReactNode }> = ({ className, children }) => {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-white/6">
      <table className={cn("w-full text-sm", className)}>{children}</table>
    </div>
  );
};

export const TableHeader: React.FC<{ className?: string; children?: React.ReactNode }> = ({ className, children }) => {
  return (
    <thead className={cn("bg-[#111827]/50", className)}>
      {children}
    </thead>
  );
};

export const TableBody: React.FC<{ className?: string; children?: React.ReactNode }> = ({ className, children }) => (
  <tbody className={className}>{children}</tbody>
);

export const TableRow: React.FC<{ className?: string; children?: React.ReactNode }> = ({ className, children }) => {
  return (
    <tr className={cn(
      "border-b transition-colors border-white/4 hover:bg-white/2",
      className
    )}>
      {children}
    </tr>
  );
};

export const TableHead: React.FC<{ className?: string; children?: React.ReactNode }> = ({ className, children }) => {
  return (
    <th className={cn(
      "h-12 px-4 text-left align-middle font-semibold text-[#A0AABF]",
      className
    )}>
      {children}
    </th>
  );
};

export const TableCell: React.FC<{ className?: string; children?: React.ReactNode }> = ({ className, children }) => (
  <td className={cn("p-4 align-middle text-[#E8E8FF]", className)}>{children}</td>
);

// Empty State component
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => {
  const theme = useRoleTheme();
  
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <div className="p-4 rounded-2xl mb-4 bg-[#111827] text-[#A0AABF]">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-[#E8E8FF] mb-1">{title}</h3>
      {description && <p className="text-sm mb-4 max-w-sm text-[#A0AABF]">{description}</p>}
      {action}
    </div>
  );
};
