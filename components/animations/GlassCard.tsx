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
        admin: 'bg-[#111827]/40 backdrop-blur-md border-white/[0.04] shadow-md',
        user: 'bg-[#111827]/40 backdrop-blur-md border-white/[0.04] shadow-md',
    },
    medium: {
        admin: 'bg-[#111827]/60 backdrop-blur-lg border-white/[0.06] shadow-lg shadow-blue-900/10',
        user: 'bg-[#111827]/60 backdrop-blur-lg border-white/[0.06] shadow-lg shadow-violet-900/10',
    },
    high: {
        admin: 'bg-[#111827]/80 backdrop-blur-xl border-white/[0.08] shadow-xl shadow-blue-900/20',
        user: 'bg-[#111827]/80 backdrop-blur-xl border-white/[0.08] shadow-xl shadow-violet-900/20',
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
                        background: `linear-gradient(135deg, ${theme.isAdmin ? '#3b82f6' : '#a78bfa'}30, transparent 50%, ${theme.isAdmin ? '#1E3A8A' : '#4C1D95'}20)`,
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
