import React from "react";
import { motion } from "framer-motion";

type RippleLoaderProps = {
  icon?: React.ReactNode;
  size?: number;
  duration?: number;
  logoColor?: string;
  rippleColor?: string;
};

const RippleLoader: React.FC<RippleLoaderProps> = ({
  icon,
  size = 280,
  duration = 2.5,
  logoColor = "#ffffff",
  rippleColor = "6, 182, 212", // #06b6d4 cyan - high visibility against dark purple background
}) => {
  const baseInset = 40;
  const rippleBoxes = Array.from({ length: 5 }, (_, i) => ({
    inset: `${baseInset - i * 10}%`,
    zIndex: 99 - i,
    delay: i * 0.2,
    opacity: 1 - i * 0.18,
  }));

  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
    >
      {rippleBoxes.map((box, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border-t backdrop-blur-[8px]"
          style={{
            inset: box.inset,
            zIndex: box.zIndex,
            borderColor: `rgba(${rippleColor}, ${box.opacity * 0.5})`,
            background: `linear-gradient(180deg, rgba(${rippleColor}, ${0.15 - i * 0.02}), rgba(${rippleColor}, ${0.08 - i * 0.01}))`,
          }}
          animate={{
            scale: [1, 1.15, 1],
            boxShadow: [
              `rgba(${rippleColor}, 0.2) 0px 10px 20px 0px`,
              `rgba(${rippleColor}, 0.35) 0px 25px 35px 0px`,
              `rgba(${rippleColor}, 0.2) 0px 10px 20px 0px`,
            ],
          }}
          transition={{
            repeat: Infinity,
            duration,
            delay: box.delay,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Center glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          inset: '35%',
          zIndex: 100,
          background: `radial-gradient(circle, rgba(6, 182, 212, 0.6) 0%, rgba(${rippleColor}, 0.35) 50%, transparent 70%)`,
        }}
        animate={{
          opacity: [0.6, 1, 0.6],
          scale: [0.95, 1.05, 0.95],
        }}
        transition={{
          repeat: Infinity,
          duration: duration * 0.8,
          ease: "easeInOut",
        }}
      />

      {/* Icon in center */}
      {icon && (
        <div className="absolute inset-0 grid place-content-center p-[38%]">
          <motion.span
            className="w-full h-full"
            animate={{ 
              color: [logoColor, "#ffffff", logoColor],
              filter: [
                "drop-shadow(0 0 8px rgba(6, 182, 212, 0.9))",
                "drop-shadow(0 0 24px rgba(6, 182, 212, 0.95))",
                "drop-shadow(0 0 8px rgba(6, 182, 212, 0.9))",
              ]
            }}
            transition={{
              repeat: Infinity,
              duration,
              ease: "easeInOut",
            }}
          >
            <span
              className="w-full h-full block"
              style={{ width: "100%", height: "100%" }}
            >
              {React.cloneElement(icon as React.ReactElement, {
                style: {
                  width: "100%",
                  height: "100%",
                  fill: "currentColor",
                },
              })}
            </span>
          </motion.span>
        </div>
      )}
    </div>
  );
};

export default RippleLoader;
