"use client";
import React, { useEffect, useRef } from "react";

const vertexShaderSource = `
  attribute vec4 a_position;
  void main() {
    gl_Position = a_position;
  }
`;

// Dynamic fragment shader with color uniforms
const createFragmentShaderSource = () => `
precision mediump float;

uniform vec2 iResolution;
uniform float iTime;
uniform vec3 uColorR;
uniform vec3 uColorG;
uniform vec3 uColorB;

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (2.0 * fragCoord - iResolution.xy) / min(iResolution.x, iResolution.y);

    for(float i = 1.0; i < 8.0; i++) {
        uv.y += i * 0.1 / i * 
            sin(uv.x * i * i + iTime * 1.9) * sin(uv.y * i * i + iTime * 1.9);
    }

    vec3 col;
    col.r = uv.y * uColorR.r + uColorR.g;
    col.g = uv.y * uColorG.r + uColorG.g;
    col.b = uv.y * uColorB.r + uColorB.b;

    fragColor = vec4(col, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
`;

export type BlurSize = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";

export type ColorTheme = "purple" | "cyan" | "admin" | "employee" | "auth";

interface ColorValues {
  multiplier: number;
  offset: number;
}

interface WaveBackgroundProps {
  backdropBlurAmount?: BlurSize;
  className?: string;
  colorTheme?: ColorTheme;
  customColors?: {
    r: ColorValues;
    g: ColorValues;
    b: ColorValues;
  };
}

const blurClassMap: Record<BlurSize, string> = {
  none: "backdrop-blur-none",
  sm: "backdrop-blur-sm",
  md: "backdrop-blur-md",
  lg: "backdrop-blur-lg",
  xl: "backdrop-blur-xl",
  "2xl": "backdrop-blur-2xl",
  "3xl": "backdrop-blur-3xl",
};

// Predefined color themes - PROFESSIONAL ENTERPRISE-GRADE
const colorThemes: Record<ColorTheme, { r: ColorValues; g: ColorValues; b: ColorValues }> = {
  // Admin: Professional Deep Blue Theme (Enterprise HR)
  admin: {
    r: { multiplier: 0.15, offset: 0.08 },   // Minimal red for clean blue
    g: { multiplier: 0.35, offset: 0.15 },   // Controlled green  
    b: { multiplier: 1.0, offset: 0.55 },    // Strong professional blue
  },
  // Employee: Professional Purple Theme
  employee: {
    r: { multiplier: 0.55, offset: 0.25 },   // Purple-tinted red
    g: { multiplier: 0.25, offset: 0.10 },   // Low green for purple
    b: { multiplier: 0.95, offset: 0.60 },   // Strong blue/purple
  },
  // Purple (default Dayflow theme)
  purple: {
    r: { multiplier: 0.5, offset: 0.2 },
    g: { multiplier: 0.2, offset: 0.1 },
    b: { multiplier: 0.9, offset: 0.65 },
  },
  // Cyan theme (for variety)
  cyan: {
    r: { multiplier: 0.1, offset: 0.05 },
    g: { multiplier: 0.5, offset: 0.35 },
    b: { multiplier: 0.85, offset: 0.55 },
  },
  // Auth pages - Subtle professional gradient
  auth: {
    r: { multiplier: 0.35, offset: 0.12 },
    g: { multiplier: 0.25, offset: 0.10 },
    b: { multiplier: 0.9, offset: 0.55 },
  },
};

function WaveBackground({
  backdropBlurAmount = "md",
  className = "",
  colorTheme = "purple",
  customColors,
}: WaveBackgroundProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) {
      console.error("WebGL not supported");
      return;
    }

    const compileShader = (type: number, source: string): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compilation error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const fragmentShaderSource = createFragmentShaderSource();
    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program linking error:", gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const iResolutionLocation = gl.getUniformLocation(program, "iResolution");
    const iTimeLocation = gl.getUniformLocation(program, "iTime");
    const uColorRLocation = gl.getUniformLocation(program, "uColorR");
    const uColorGLocation = gl.getUniformLocation(program, "uColorG");
    const uColorBLocation = gl.getUniformLocation(program, "uColorB");

    // Get colors from theme or custom
    const theme = colorThemes[colorTheme];
    const colors = customColors || theme;

    let startTime = Date.now();

    const render = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }

      const currentTime = (Date.now() - startTime) / 1000;

      gl.uniform2f(iResolutionLocation, width, height);
      gl.uniform1f(iTimeLocation, currentTime);
      
      // Set color uniforms
      gl.uniform3f(uColorRLocation, colors.r.multiplier, colors.r.offset, 0);
      gl.uniform3f(uColorGLocation, colors.g.multiplier, colors.g.offset, 0);
      gl.uniform3f(uColorBLocation, colors.b.multiplier, 0, colors.b.offset);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [colorTheme, customColors]);

  const finalBlurClass = blurClassMap[backdropBlurAmount] || blurClassMap["md"];

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ display: "block" }}
      />
      <div className={`absolute inset-0 ${finalBlurClass}`} />
      {/* Dark overlay to make content readable */}
      <div className="absolute inset-0 bg-[#151023]/70" />
    </div>
  );
}

export default WaveBackground;
