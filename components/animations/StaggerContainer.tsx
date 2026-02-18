import React from 'react';
import { motion, type Variants } from 'framer-motion';

interface StaggerContainerProps {
    children: React.ReactNode;
    className?: string;
    staggerDelay?: number;
    delayStart?: number;
}

const containerVariants = (staggerDelay: number, delayStart: number): Variants => ({
    hidden: {},
    visible: {
        transition: {
            staggerChildren: staggerDelay,
            delayChildren: delayStart,
        },
    },
});

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
    children,
    className = '',
    staggerDelay = 0.08,
    delayStart = 0,
}) => (
    <motion.div
        className={className}
        variants={containerVariants(staggerDelay, delayStart)}
        initial="hidden"
        animate="visible"
    >
        {children}
    </motion.div>
);

// Stagger item variants
type AnimationType = 'fadeUp' | 'fadeIn' | 'scaleUp' | 'slideRight';

const itemVariantMap: Record<AnimationType, Variants> = {
    fadeUp: {
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
    },
    fadeIn: {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } },
    },
    scaleUp: {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } },
    },
    slideRight: {
        hidden: { opacity: 0, x: -15 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: 'easeOut' } },
    },
};

interface StaggerItemProps {
    children: React.ReactNode;
    className?: string;
    animation?: AnimationType;
}

export const StaggerItem: React.FC<StaggerItemProps> = ({
    children,
    className = '',
    animation = 'fadeUp',
}) => (
    <motion.div className={className} variants={itemVariantMap[animation]}>
        {children}
    </motion.div>
);
