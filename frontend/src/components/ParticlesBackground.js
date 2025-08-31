// File intentionally left blank. Particles background removed from project.
import React, { useCallback } from "react";
import Particles from "@tsparticles/react";
import { loadAll } from "@tsparticles/all";

const ParticlesBackground = () => {
  const particlesInit = useCallback(async (engine) => {
    await loadAll(engine);
  }, []);

  return (
    <div style={{
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      zIndex: 0,
      pointerEvents: "none",
      overflow: "hidden"
    }}>
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={{
          fullScreen: { enable: false },
          background: { color: "transparent" },
          fpsLimit: 60,
          particles: {
            number: { value: 40, density: { enable: true, value_area: 800 } },
            color: {
              value: ["#002147", "#2E7D32", "#C9A635"]
            },
            shape: {
              type: ["circle", "polygon"],
              polygon: { nb_sides: 5 }
            },
            opacity: {
              value: 0.5,
              random: true,
              anim: { enable: true, speed: 0.5, opacity_min: 0.2, sync: false }
            },
            size: {
              value: 8,
              random: { enable: true, minimumValue: 3 },
              anim: { enable: true, speed: 2, size_min: 2, sync: false }
            },
            move: {
              enable: true,
              speed: 1.2,
              direction: "none",
              random: true,
              straight: false,
              outModes: { default: "out" },
              attract: { enable: false }
            },
            links: {
              enable: true,
              distance: 160,
              color: "#C9A635",
              opacity: 0.2,
              width: 1
            }
          },
          detectRetina: true
        }}
        style={{
          width: "100%",
          height: "100%"
        }}
      />
    </div>
  );
};

export default ParticlesBackground;
