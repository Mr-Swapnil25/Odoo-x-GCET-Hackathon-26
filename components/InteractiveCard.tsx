import React, { useRef, useState } from "react";
import { motion, useMotionValue, useTransform, useMotionTemplate } from "framer-motion";
import { cn } from "../lib/utils";

interface InteractiveCardProps {
  children: React.ReactNode;
  className?: string;
  interactiveColor?: string;
  borderRadius?: string;
  rotationFactor?: number;
  transitionDuration?: number;
  transitionEasing?: string;
  tailwindBgClass?: string;
  aspectRatio?: string;
  width?: string;
  height?: string;
  glowIntensity?: number;
  borderColor?: string;
  disableRotation?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export const InteractiveCard: React.FC<InteractiveCardProps> = ({
  children,
  className,
  interactiveColor = "#8359f8",
  borderRadius = "16px",
  rotationFactor = 0.3,
  transitionDuration = 0.3,
  transitionEasing = "easeOut",
  tailwindBgClass = "bg-slate-800/40 backdrop-blur-xl",
  aspectRatio,
  width,
  height,
  glowIntensity = 0.5,
  borderColor = "rgba(255, 255, 255, 0.08)",
  disableRotation = false,
  onClick,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const rotateXTrans = useTransform(y, [0, 1], [rotationFactor * 12, -rotationFactor * 12]);
  const rotateYTrans = useTransform(x, [0, 1], [-rotationFactor * 12, rotationFactor * 12]);

  const handlePointerMove = (e: React.PointerEvent) => {
    const bounds = cardRef.current?.getBoundingClientRect();
    if (!bounds) return;

    const px = (e.clientX - bounds.left) / bounds.width;
    const py = (e.clientY - bounds.top) / bounds.height;

    x.set(px);
    y.set(py);
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    x.set(0.5);
    y.set(0.5);
  };

  const xPercentage = useTransform(x, (val) => `${val * 100}%`);
  const yPercentage = useTransform(y, (val) => `${val * 100}%`);

  const interactiveBackground = useMotionTemplate`radial-gradient(circle at ${xPercentage} ${yPercentage}, ${interactiveColor} 0%, transparent 70%)`;
  const glowEffect = useMotionTemplate`radial-gradient(400px circle at ${xPercentage} ${yPercentage}, ${interactiveColor}40, transparent 60%)`;

  return (
    <motion.div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={handlePointerLeave}
      onClick={onClick}
      style={{
        perspective: 1000,
        borderRadius,
        width: width || "100%",
        height: height || "auto",
        aspectRatio: aspectRatio,
      }}
      className="relative isolate"
    >
      {/* Outer glow effect */}
      <motion.div
        className="absolute -inset-[1px] rounded-[inherit] z-0 pointer-events-none"
        style={{
          background: glowEffect,
          opacity: isHovered ? glowIntensity * 0.3 : 0,
          transition: `opacity ${transitionDuration}s ${transitionEasing}`,
          filter: "blur(20px)",
        }}
      />
      
      <motion.div
        style={{
          rotateX: disableRotation ? 0 : rotateXTrans,
          rotateY: disableRotation ? 0 : rotateYTrans,
          transformStyle: "preserve-3d",
          transition: `transform ${transitionDuration}s ${transitionEasing}`,
          borderRadius,
          border: `1px solid ${borderColor}`,
        }}
        className="w-full h-full overflow-hidden shadow-xl relative"
      >
        {/* Background Interactive Layer */}
        <motion.div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background: interactiveBackground,
            transition: `opacity ${transitionDuration}s ${transitionEasing}`,
            opacity: isHovered ? glowIntensity : 0,
            borderRadius,
          }}
        />

        {/* Border glow on hover */}
        <motion.div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            borderRadius,
            boxShadow: `inset 0 0 0 1px ${interactiveColor}`,
            opacity: isHovered ? 0.3 : 0,
            transition: `opacity ${transitionDuration}s ${transitionEasing}`,
          }}
        />

        {/* Content */}
        <div
          className={cn(
            "relative z-10 w-full h-full",
            tailwindBgClass,
            className
          )}
          style={{ borderRadius }}
        >
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
};

// Preset variations for different use cases
export const StatCard = ({ 
  children, 
  className,
  ...props 
}: { 
  children: React.ReactNode; 
  className?: string;
  interactiveColor?: string;
}) => (
  <InteractiveCard
    borderRadius="16px"
    rotationFactor={0.2}
    glowIntensity={0.4}
    tailwindBgClass="bg-slate-800/50 backdrop-blur-xl"
    className={className}
    {...props}
  >
    {children}
  </InteractiveCard>
);

export const ProfileCard = ({ 
  children, 
  className,
  ...props 
}: { 
  children: React.ReactNode; 
  className?: string;
  interactiveColor?: string;
}) => (
  <InteractiveCard
    borderRadius="24px"
    rotationFactor={0.25}
    glowIntensity={0.5}
    tailwindBgClass="bg-slate-800/60 backdrop-blur-2xl"
    className={className}
    {...props}
  >
    {children}
  </InteractiveCard>
);

export const TableCard = ({ 
  children, 
  className,
  ...props 
}: { 
  children: React.ReactNode; 
  className?: string;
}) => (
  <InteractiveCard
    borderRadius="20px"
    rotationFactor={0.1}
    disableRotation={true}
    glowIntensity={0.3}
    tailwindBgClass="bg-slate-800/40 backdrop-blur-xl"
    className={className}
    {...props}
  >
    {children}
  </InteractiveCard>
);

export default InteractiveCard;
