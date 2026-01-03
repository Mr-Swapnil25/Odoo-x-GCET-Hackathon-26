import React, { createContext, useContext } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useStore } from '../store';
import { Role } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Theme-aware hook for getting role-based colors
export const useRoleTheme = () => {
  const { currentUser } = useStore();
  const isAdmin = currentUser?.role === Role.ADMIN;
  
  return {
    isAdmin,
    // Primary colors
    primary: isAdmin ? '#1e40af' : '#7c3aed',
    primaryHover: isAdmin ? '#1e3a8a' : '#6d28d9',
    primaryLight: isAdmin ? '#3b82f6' : '#a78bfa',
    primaryGlow: isAdmin ? 'rgba(30, 64, 175, 0.3)' : 'rgba(124, 58, 237, 0.3)',
    // Background colors
    cardBg: isAdmin ? 'bg-slate-800/60' : 'bg-[#1e1835]/60',
    cardBorder: isAdmin ? 'border-slate-700' : 'border-[#2d2249]',
    inputBg: isAdmin ? 'bg-slate-800' : 'bg-[#1e1835]',
    // Text colors
    textMuted: isAdmin ? 'text-slate-400' : 'text-[#a090cb]',
    textPlaceholder: isAdmin ? 'placeholder:text-slate-500' : 'placeholder:text-[#a090cb]/50',
    // Focus ring
    focusRing: isAdmin ? 'focus:ring-blue-500' : 'focus:ring-[#6e3df5]',
    focusOffset: isAdmin ? 'focus:ring-offset-slate-900' : 'focus:ring-offset-[#151023]',
    // Gradient classes
    gradientFrom: isAdmin ? '#1e40af' : '#6e3df5',
    gradientTo: isAdmin ? '#3b82f6' : '#9f7afa',
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
        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-600/30'
        : 'bg-[#6e3df5] text-white hover:bg-[#5b32cc] shadow-sm shadow-[#6e3df5]/30',
      secondary: theme.isAdmin
        ? 'bg-slate-700 text-white hover:bg-slate-600'
        : 'bg-[#2d2249] text-white hover:bg-[#3d3259]',
      outline: theme.isAdmin
        ? 'border border-slate-600 bg-transparent hover:bg-slate-700/50 text-slate-300'
        : 'border border-[#2d2249] bg-transparent hover:bg-[#2d2249]/50 text-[#a090cb]',
      ghost: theme.isAdmin
        ? 'hover:bg-slate-700 text-slate-300'
        : 'hover:bg-[#2d2249] text-[#a090cb]',
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
          'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]',
          theme.isAdmin 
            ? 'focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900'
            : 'focus:ring-[#6e3df5] focus:ring-offset-2 focus:ring-offset-[#151023]',
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
        {label && <label className={cn("block text-sm font-medium mb-1.5", theme.textMuted)}>{label}</label>}
        <input
          ref={ref}
          className={cn(
            'flex h-11 w-full rounded-lg border px-4 py-2.5 text-sm text-white transition-all duration-150 focus:outline-none focus:ring-2 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50',
            theme.isAdmin
              ? 'border-slate-600 bg-slate-800 placeholder:text-slate-500 focus:ring-blue-500'
              : 'border-[#2d2249] bg-[#1e1835] placeholder:text-[#a090cb]/50 focus:ring-[#6e3df5]',
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
  options: { label: string; value: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, ...props }, ref) => {
    const theme = useRoleTheme();
    return (
      <div className="w-full">
        {label && <label className={cn("block text-sm font-medium mb-1.5", theme.textMuted)}>{label}</label>}
        <select
          ref={ref}
          className={cn(
            'flex h-11 w-full rounded-lg border px-4 py-2.5 text-sm text-white transition-all duration-150 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50',
            theme.isAdmin
              ? 'border-slate-600 bg-slate-800 focus:ring-blue-500'
              : 'border-[#2d2249] bg-[#1e1835] focus:ring-[#6e3df5]',
            error && 'border-red-500',
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className={theme.isAdmin ? "bg-slate-800" : "bg-[#1e1835]"}>
              {opt.label}
            </option>
          ))}
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
      'rounded-xl border backdrop-blur-md text-white shadow-lg transition-all duration-200',
      theme.isAdmin 
        ? 'bg-slate-800/70 border-slate-700/50 hover:shadow-xl hover:shadow-blue-900/10'
        : 'bg-[#1e1835]/70 border-[#2d2249]/50 hover:shadow-xl hover:shadow-purple-900/10'
    ),
    elevated: cn(
      'rounded-xl border backdrop-blur-md text-white shadow-xl transition-all duration-200',
      theme.isAdmin 
        ? 'bg-slate-800/80 border-slate-600/50 shadow-blue-900/20'
        : 'bg-[#1e1835]/80 border-[#3d3259]/50 shadow-purple-900/20'
    ),
    outlined: cn(
      'rounded-xl border-2 text-white transition-all duration-200',
      theme.isAdmin 
        ? 'bg-transparent border-slate-600 hover:border-slate-500'
        : 'bg-transparent border-[#2d2249] hover:border-[#3d3259]'
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
      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
      : 'bg-[#6e3df5]/20 text-[#a78bfa] border border-[#6e3df5]/30',
    success: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    warning: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    danger: 'bg-red-500/20 text-red-400 border border-red-500/30',
    info: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
    outline: theme.isAdmin
      ? 'border border-slate-600 text-slate-300'
      : 'border border-[#2d2249] text-[#a090cb]',
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

const employeeGradients = [
  'from-purple-500 to-violet-600',
  'from-violet-500 to-purple-700',
  'from-fuchsia-500 to-purple-600',
  'from-purple-600 to-indigo-500',
];

export const Avatar: React.FC<AvatarProps> = ({ name, size = 'md', className }) => {
  const theme = useRoleTheme();
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  // Deterministic gradient based on name
  const gradients = theme.isAdmin ? adminGradients : employeeGradients;
  const gradientIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % gradients.length;
  
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-20 h-20 text-2xl',
  };
  
  return (
    <div className={cn(
      `rounded-full bg-gradient-to-br ${gradients[gradientIndex]} flex items-center justify-center text-white font-bold shadow-md`,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className={cn(
        "w-full rounded-2xl border shadow-2xl animate-in fade-in zoom-in-95 duration-200",
        sizes[size],
        theme.isAdmin
          ? 'bg-slate-800 border-slate-700 shadow-blue-900/20'
          : 'bg-[#1e1835] border-[#2d2249] shadow-[#6e3df5]/10'
      )}>
        <div className={cn(
          "flex items-center justify-between border-b p-5",
          theme.isAdmin ? "border-slate-700" : "border-[#2d2249]"
        )}>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button 
            onClick={onClose} 
            className={cn(
              "p-2 rounded-lg transition-colors",
              theme.isAdmin 
                ? "text-slate-400 hover:text-white hover:bg-slate-700"
                : "text-[#a090cb] hover:text-white hover:bg-[#2d2249]"
            )}
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
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
          <p className={cn("text-sm font-medium", theme.textMuted)}>{title}</p>
          <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
          {trend && (
            <p className={cn(
              "text-sm font-medium flex items-center gap-1",
              trend.isPositive ? "text-emerald-400" : "text-red-400"
            )}>
              {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
              <span className={cn("font-normal", theme.textMuted)}>vs last month</span>
            </p>
          )}
        </div>
        {icon && (
          <div className={cn(
            "p-3 rounded-xl",
            theme.isAdmin 
              ? "bg-blue-500/10 text-blue-400"
              : "bg-purple-500/10 text-purple-400"
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
  const theme = useRoleTheme();
  return (
    <div className={cn(
      "w-full overflow-hidden rounded-xl border",
      theme.isAdmin ? "border-slate-700" : "border-[#2d2249]"
    )}>
      <table className={cn("w-full text-sm", className)}>{children}</table>
    </div>
  );
};

export const TableHeader: React.FC<{ className?: string; children?: React.ReactNode }> = ({ className, children }) => {
  const theme = useRoleTheme();
  return (
    <thead className={cn(
      theme.isAdmin ? "bg-slate-800/50" : "bg-[#1e1835]/50",
      className
    )}>
      {children}
    </thead>
  );
};

export const TableBody: React.FC<{ className?: string; children?: React.ReactNode }> = ({ className, children }) => (
  <tbody className={className}>{children}</tbody>
);

export const TableRow: React.FC<{ className?: string; children?: React.ReactNode }> = ({ className, children }) => {
  const theme = useRoleTheme();
  return (
    <tr className={cn(
      "border-b transition-colors",
      theme.isAdmin 
        ? "border-slate-700/50 hover:bg-slate-800/30"
        : "border-[#2d2249]/50 hover:bg-[#1e1835]/30",
      className
    )}>
      {children}
    </tr>
  );
};

export const TableHead: React.FC<{ className?: string; children?: React.ReactNode }> = ({ className, children }) => {
  const theme = useRoleTheme();
  return (
    <th className={cn(
      "h-12 px-4 text-left align-middle font-semibold",
      theme.isAdmin ? "text-slate-300" : "text-[#a090cb]",
      className
    )}>
      {children}
    </th>
  );
};

export const TableCell: React.FC<{ className?: string; children?: React.ReactNode }> = ({ className, children }) => (
  <td className={cn("p-4 align-middle text-white", className)}>{children}</td>
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
        <div className={cn(
          "p-4 rounded-2xl mb-4",
          theme.isAdmin ? "bg-slate-800 text-slate-400" : "bg-[#1e1835] text-[#a090cb]"
        )}>
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
      {description && <p className={cn("text-sm mb-4 max-w-sm", theme.textMuted)}>{description}</p>}
      {action}
    </div>
  );
};