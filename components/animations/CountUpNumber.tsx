import React, { useEffect, useRef, useState } from 'react';

interface CountUpNumberProps {
    end: number;
    duration?: number;
    prefix?: string;
    suffix?: string;
    className?: string;
    decimals?: number;
}

function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
}

export const CountUpNumber: React.FC<CountUpNumberProps> = ({
    end,
    duration = 800,
    prefix = '',
    suffix = '',
    className = '',
    decimals = 0,
}) => {
    const [display, setDisplay] = useState(0);
    const rafRef = useRef<number>(0);
    const startTimeRef = useRef<number>(0);
    const prevEndRef = useRef<number>(0);

    useEffect(() => {
        const startValue = prevEndRef.current;
        prevEndRef.current = end;
        startTimeRef.current = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTimeRef.current;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOutCubic(progress);
            const currentValue = startValue + (end - startValue) * easedProgress;

            setDisplay(currentValue);

            if (progress < 1) {
                rafRef.current = requestAnimationFrame(animate);
            }
        };

        rafRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(rafRef.current);
    }, [end, duration]);

    const formatted = decimals > 0 ? display.toFixed(decimals) : Math.round(display).toString();

    return (
        <span className={className}>
            {prefix}{formatted}{suffix}
        </span>
    );
};
