import React from 'react';
import { useRoleTheme, cn } from '../UI';
import { Tilt3DCard } from './Tilt3DCard';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    elevation?: 'low' | 'medium' | 'high';
    gradientBorder?: boolean;
    tilt?: boolean;
    onClick?: () => void;
}

const elevationStyles = {
    low: {
        admin: 'bg-slate-800/40 backdrop-blur-md border-slate-700/30 shadow-md',
        user: 'bg-[#1e1835]/40 backdrop-blur-md border-[#2d2249]/30 shadow-md',
    },
    medium: {
        admin: 'bg-slate-800/60 backdrop-blur-lg border-slate-700/50 shadow-lg shadow-blue-900/10',
        user: 'bg-[#1e1835]/60 backdrop-blur-lg border-[#2d2249]/50 shadow-lg shadow-purple-900/10',
    },
    high: {
        admin: 'bg-slate-800/80 backdrop-blur-xl border-slate-600/50 shadow-xl shadow-blue-900/20',
        user: 'bg-[#1e1835]/80 backdrop-blur-xl border-[#3d3259]/50 shadow-xl shadow-purple-900/20',
    },
};

export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    className = '',
    elevation = 'medium',
    gradientBorder = false,
    tilt = false,
    onClick,
}) => {
    const theme = useRoleTheme();
    const role = theme.isAdmin ? 'admin' : 'user';

    const baseClasses = cn(
        'rounded-xl border transition-all duration-300 relative overflow-hidden',
        elevationStyles[elevation][role],
        className
    );

    const card = (
        <div className={cn('relative', tilt && 'h-full')} onClick={onClick}>
            {gradientBorder && (
                <div
                    className="absolute inset-0 rounded-xl pointer-events-none z-0"
                    style={{
                        padding: '1px',
                        background: `linear-gradient(135deg, ${theme.isAdmin ? '#3b82f6' : '#a78bfa'}30, transparent 50%, ${theme.isAdmin ? '#1e40af' : '#7c3aed'}20)`,
                        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                        WebkitMaskComposite: 'xor',
                        maskComposite: 'exclude',
                    }}
                />
            )}
            <div className={baseClasses}>
                {children}
            </div>
        </div>
    );

    if (tilt) {
        return (
            <Tilt3DCard className="h-full">
                {card}
            </Tilt3DCard>
        );
    }

    return card;
};
