import React, { useRef, useState, useCallback } from 'react';

interface Tilt3DCardProps {
    children: React.ReactNode;
    className?: string;
    maxTilt?: number;
    scale?: number;
    speed?: number;
    glare?: boolean;
}

export const Tilt3DCard: React.FC<Tilt3DCardProps> = ({
    children,
    className = '',
    maxTilt = 5,
    scale = 1.02,
    speed = 400,
    glare = true,
}) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [transform, setTransform] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)');
    const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        const tiltX = (maxTilt - y * maxTilt * 2).toFixed(2);
        const tiltY = (x * maxTilt * 2 - maxTilt).toFixed(2);
        setTransform(`perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(${scale},${scale},${scale})`);
        setGlarePos({ x: x * 100, y: y * 100 });
    }, [maxTilt, scale]);

    const handleMouseLeave = useCallback(() => {
        setIsHovered(false);
        setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)');
        setGlarePos({ x: 50, y: 50 });
    }, []);

    const handleMouseEnter = useCallback(() => {
        setIsHovered(true);
    }, []);

    return (
        <div
            ref={cardRef}
            className={className}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={handleMouseEnter}
            style={{
                transform,
                transition: isHovered ? `transform ${speed * 0.5}ms ease-out` : `transform ${speed}ms ease-out`,
                transformStyle: 'preserve-3d',
                willChange: 'transform',
            }}
        >
            {children}
            {glare && isHovered && (
                <div
                    className="pointer-events-none absolute inset-0 rounded-xl overflow-hidden z-10"
                    style={{
                        background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.08) 0%, transparent 60%)`,
                    }}
                />
            )}
        </div>
    );
};
