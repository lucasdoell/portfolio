import React, { useEffect, useRef } from "react";

interface BackgroundProps {
  gradientWidth?: number;
  gradientHeight?: number;
  gradientTilt?: number;
  gradientOpacity?: number;
  gridOpacity?: number;
}

export default function Background({
  gradientWidth = 70,
  gradientHeight = 50,
  gradientTilt = -40,
  gradientOpacity = 90,
  gridOpacity = 100,
}: BackgroundProps) {
  const backgroundRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;

    function lerp(start: number, end: number, factor: number): number {
      return start + (end - start) * factor;
    }

    function updateGradientPosition() {
      if (!backgroundRef.current) return;

      // Smooth out the movement
      currentX = lerp(currentX, targetX, 0.05);
      currentY = lerp(currentY, targetY, 0.05);

      // Update CSS custom properties for both mask and gradient
      backgroundRef.current.style.setProperty(
        "--mask-position-x",
        `${currentX}px`
      );
      backgroundRef.current.style.setProperty(
        "--mask-position-y",
        `${currentY}px`
      );
      backgroundRef.current.style.setProperty(
        "--gradient-position-x",
        `${(currentX / backgroundRef.current.offsetWidth) * 100}%`
      );
      backgroundRef.current.style.setProperty(
        "--gradient-position-y",
        `${(currentY / backgroundRef.current.offsetHeight) * 100}%`
      );

      requestAnimationFrame(updateGradientPosition);
    }

    function handleMouseMove(event: MouseEvent) {
      if (!backgroundRef.current) return;

      const rect = backgroundRef.current.getBoundingClientRect();
      targetX = event.clientX - rect.left;
      targetY = event.clientY - rect.top;
    }

    // Initialize animation
    let animationFrame = requestAnimationFrame(updateGradientPosition);

    // Add event listener with throttling
    let lastTime = 0;
    const throttleInterval = 1000 / 60; // 60fps

    function throttledMouseMove(event: MouseEvent) {
      const now = performance.now();
      if (now - lastTime >= throttleInterval) {
        handleMouseMove(event);
        lastTime = now;
      }
    }

    document.addEventListener("mousemove", throttledMouseMove);

    return () => {
      document.removeEventListener("mousemove", throttledMouseMove);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <div
      ref={backgroundRef}
      className="absolute inset-0 overflow-hidden"
      style={
        {
          "--mask-radius": "50vh",
          "--gradient-width": `${gradientWidth / 4}%`,
          "--gradient-height": `${gradientHeight / 4}%`,
          "--gradient-tilt": `${gradientTilt}deg`,
        } as React.CSSProperties
      }
    >
      <div className="absolute inset-0 mask-layer">
        <div
          className="absolute w-[400%] h-[400%] -left-[150%] -top-[150%] pointer-events-none origin-center transition-transform duration-75"
          style={{
            opacity: gradientOpacity / 100,
            transform: `rotate(${gradientTilt}deg)`,
            background: `radial-gradient(
              circle at var(--gradient-position-x, 50%) var(--gradient-position-y, 50%),
              #094074 0%,
              transparent 100%
            )`,
          }}
        />

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: gridOpacity / 100,
            backgroundImage: `
              linear-gradient(90deg, rgba(255, 255, 255, 0.1) 0, rgba(255, 255, 255, 0.1) 1px, transparent 1px, transparent 0.25rem),
              linear-gradient(0deg, rgba(255, 255, 255, 0.1) 0, rgba(255, 255, 255, 0.1) 1px, transparent 1px, transparent 0.25rem)
            `,
            backgroundSize: "0.25rem 0.25rem",
          }}
        />
      </div>

      <style>{`
        .mask-layer {
          mask-image: radial-gradient(
            var(--mask-radius) at var(--mask-position-x, 50%)
              var(--mask-position-y, 50%),
            black 0%,
            transparent 100%
          );
          -webkit-mask-image: radial-gradient(
            var(--mask-radius) at var(--mask-position-x, 50%)
              var(--mask-position-y, 50%),
            black 0%,
            transparent 100%
          );
        }
      `}</style>
    </div>
  );
}
