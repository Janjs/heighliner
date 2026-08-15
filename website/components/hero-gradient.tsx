"use client";

import { ShaderGradient, ShaderGradientCanvas } from "@shadergradient/react";
import { useSyncExternalStore } from "react";

const motionQuery = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const media = window.matchMedia(motionQuery);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

export function HeroGradient() {
  const reduceMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(motionQuery).matches,
    () => false,
  );

  return (
    <div className="landing-dashboard-glow" aria-hidden>
      <ShaderGradientCanvas
        pixelDensity={1}
        fov={45}
        pointerEvents="none"
        style={{ position: "absolute", inset: 0, zIndex: 0 }}
      >
        <ShaderGradient
          type="waterPlane"
          animate={reduceMotion ? "off" : "on"}
          grain="on"
          grainBlending={0.9}
          color1="#f7e6cc"
          color2="#e8a86a"
          color3="#d4784a"
          brightness={1.15}
          lightType="3d"
          envPreset="dawn"
          uSpeed={0.12}
          uStrength={1.6}
          uDensity={1.3}
          uFrequency={5.5}
          cDistance={3.4}
          cAzimuthAngle={180}
          cPolarAngle={90}
          reflection={0.05}
        />
      </ShaderGradientCanvas>
      <div className="landing-dashboard-glow-fade" />
    </div>
  );
}
