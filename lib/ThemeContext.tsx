import React, { createContext, useContext, useMemo } from 'react';
import type { Role } from '../types';

// Theme system
// Role-based theming: Admin (Blue) vs User (Purple)

export interface ThemeColors {
  // Primary brand colors
  primary: string;
  primaryHover: string;
  primaryLight: string;
  primaryDark: string;
  
  // Secondary colors
  secondary: string;
  secondaryHover: string;
  
  // Accent colors
  accent: string;
  accentLight: string;
  
  // Background colors
  bgPrimary: string;
  bgSecondary: string;
  bgCard: string;
  bgCardHover: string;
  bgMuted: string;
  
  // Border colors
  border: string;
  borderLight: string;
  borderFocus: string;
  
  // Text colors
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textOnPrimary: string;
  
  // Status colors (same for both themes)
  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  error: string;
  errorBg: string;
  info: string;
  infoBg: string;
  
  // Gradient definitions
  gradientPrimary: string;
  gradientCard: string;
  gradientHero: string;
  
  // Shadow colors
  shadowPrimary: string;
  shadowCard: string;
  
  // Chart/Data visualization
  chartPrimary: string;
  chartSecondary: string;
  chartTertiary: string;
  chartQuaternary: string;
}

// Admin theme - Deep Blue
const adminTheme: ThemeColors = {
  // Primary brand colors - Deep Blue
  primary: '#1e40af',
  primaryHover: '#1e3a8a',
  primaryLight: '#3b82f6',
  primaryDark: '#1e3a8a',
  
  // Secondary colors
  secondary: '#3b82f6',
  secondaryHover: '#2563eb',
  
  // Accent colors
  accent: '#10b981',
  accentLight: '#34d399',
  
  // Background colors (Dark theme)
  bgPrimary: '#0c1222',
  bgSecondary: '#111827',
  bgCard: 'rgba(30, 41, 59, 0.6)',
  bgCardHover: 'rgba(30, 41, 59, 0.8)',
  bgMuted: '#1f2937',
  
  // Border colors
  border: '#1e3a5f',
  borderLight: '#1e3a5f40',
  borderFocus: '#3b82f6',
  
  // Text colors
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  textOnPrimary: '#ffffff',
  
  // Status colors
  success: '#10b981',
  successBg: 'rgba(16, 185, 129, 0.15)',
  warning: '#f59e0b',
  warningBg: 'rgba(245, 158, 11, 0.15)',
  error: '#ef4444',
  errorBg: 'rgba(239, 68, 68, 0.15)',
  info: '#3b82f6',
  infoBg: 'rgba(59, 130, 246, 0.15)',
  
  // Gradient definitions
  gradientPrimary: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
  gradientCard: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(30, 58, 95, 0.4) 100%)',
  gradientHero: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #3b82f6 100%)',
  
  // Shadow colors
  shadowPrimary: 'rgba(30, 64, 175, 0.3)',
  shadowCard: 'rgba(0, 0, 0, 0.2)',
  
  // Chart colors
  chartPrimary: '#3b82f6',
  chartSecondary: '#10b981',
  chartTertiary: '#f59e0b',
  chartQuaternary: '#8b5cf6',
};

// User theme - Purple
const userTheme: ThemeColors = {
  // Primary brand colors - Purple
  primary: '#7c3aed',
  primaryHover: '#6d28d9',
  primaryLight: '#a78bfa',
  primaryDark: '#5b21b6',
  
  // Secondary colors
  secondary: '#a78bfa',
  secondaryHover: '#8b5cf6',
  
  // Accent colors
  accent: '#ec4899',
  accentLight: '#f472b6',
  
  // Background colors (Dark theme)
  bgPrimary: '#0f0a1a',
  bgSecondary: '#1a1025',
  bgCard: 'rgba(30, 24, 53, 0.6)',
  bgCardHover: 'rgba(30, 24, 53, 0.8)',
  bgMuted: '#251d38',
  
  // Border colors
  border: '#2d2249',
  borderLight: '#2d224940',
  borderFocus: '#7c3aed',
  
  // Text colors
  textPrimary: '#f1f5f9',
  textSecondary: '#a090cb',
  textMuted: '#6b5b95',
  textOnPrimary: '#ffffff',
  
  // Status colors
  success: '#10b981',
  successBg: 'rgba(16, 185, 129, 0.15)',
  warning: '#f59e0b',
  warningBg: 'rgba(245, 158, 11, 0.15)',
  error: '#ef4444',
  errorBg: 'rgba(239, 68, 68, 0.15)',
  info: '#8b5cf6',
  infoBg: 'rgba(139, 92, 246, 0.15)',
  
  // Gradient definitions
  gradientPrimary: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
  gradientCard: 'linear-gradient(135deg, rgba(30, 24, 53, 0.8) 0%, rgba(45, 34, 73, 0.4) 100%)',
  gradientHero: 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 50%, #a78bfa 100%)',
  
  // Shadow colors
  shadowPrimary: 'rgba(124, 58, 237, 0.3)',
  shadowCard: 'rgba(0, 0, 0, 0.2)',
  
  // Chart colors
  chartPrimary: '#8b5cf6',
  chartSecondary: '#ec4899',
  chartTertiary: '#10b981',
  chartQuaternary: '#3b82f6',
};

// Theme context

interface ThemeContextValue {
  theme: ThemeColors;
  role: Role;
  isAdmin: boolean;
  // Utility class generators
  primaryBtnClass: string;
  secondaryBtnClass: string;
  cardClass: string;
  inputClass: string;
  // CSS variables for inline styles
  cssVars: Record<string, string>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  role: Role;
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ role, children }) => {
  const isAdmin = role === 'ADMIN';
  const theme = isAdmin ? adminTheme : userTheme;

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    role,
    isAdmin,
    // Tailwind utility classes based on role
    primaryBtnClass: isAdmin 
      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30' 
      : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/30',
    secondaryBtnClass: isAdmin
      ? 'border-blue-600/30 text-blue-400 hover:bg-blue-600/10'
      : 'border-purple-600/30 text-purple-400 hover:bg-purple-600/10',
    cardClass: isAdmin
      ? 'bg-slate-800/60 border-slate-700/50 backdrop-blur-md'
      : 'bg-[#1e1835]/60 border-[#2d2249] backdrop-blur-md',
    inputClass: isAdmin
      ? 'bg-slate-800 border-slate-700 focus:border-blue-500 focus:ring-blue-500/20'
      : 'bg-[#1e1835] border-[#2d2249] focus:border-purple-500 focus:ring-purple-500/20',
    cssVars: {
      '--theme-primary': theme.primary,
      '--theme-primary-hover': theme.primaryHover,
      '--theme-primary-light': theme.primaryLight,
      '--theme-secondary': theme.secondary,
      '--theme-accent': theme.accent,
      '--theme-bg-primary': theme.bgPrimary,
      '--theme-bg-card': theme.bgCard,
      '--theme-border': theme.border,
      '--theme-text-primary': theme.textPrimary,
      '--theme-text-secondary': theme.textSecondary,
      '--theme-shadow': theme.shadowPrimary,
    },
  }), [role, theme, isAdmin]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to access theme
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Return user theme as default fallback
    return {
      theme: userTheme,
      role: 'USER',
      isAdmin: false,
      primaryBtnClass: 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/30',
      secondaryBtnClass: 'border-purple-600/30 text-purple-400 hover:bg-purple-600/10',
      cardClass: 'bg-[#1e1835]/60 border-[#2d2249] backdrop-blur-md',
      inputClass: 'bg-[#1e1835] border-[#2d2249] focus:border-purple-500 focus:ring-purple-500/20',
      cssVars: {},
    };
  }
  return context;
};

// Utility function to get theme by role (for components outside context)
export const getThemeByRole = (role: Role): ThemeColors => {
  return role === 'ADMIN' ? adminTheme : userTheme;
};

export { adminTheme, userTheme };
export default ThemeContext;
