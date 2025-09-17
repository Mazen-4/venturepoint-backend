import React, { useCallback } from "react";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";

const orangeParticlesConfig = {
  particles: {
    number: { value: 120, density: { enable: true, value_area: 900 } },
    color: {
      value: ["#003366", "#2E8B57", "#D4AF37", "#ff8800"],
    },
    shape: {
      type: ["circle", "triangle", "polygon"],
      polygon: { sides: 5 }
    },
    opacity: {
      value: 0.45,
      random: true,
      anim: { enable: true, speed: 0.7, opacity_min: 0.15, sync: false }
    },
    size: {
      value: 5,
      random: true,
      anim: { enable: true, speed: 3, size_min: 0.8, sync: false }
    },
    move: {
      enable: true,
      speed: 1.2,
      direction: "top",
      random: true,
      straight: false,
      out_mode: "out",
      bounce: false,
      parallax: { enable: true, force: 30, smooth: 20 }
    },
    shadow: {
      enable: true,
      color: "#D4AF37",
      blur: 8
    },
    stroke: {
      width: 1,
      color: "#fff"
    },
  },
  interactivity: {
    detect_on: "canvas",
    events: {
      onhover: { enable: true, mode: "repulse" },
      onclick: { enable: true, mode: "push" },
      resize: true
    },
    modes: {
      repulse: { distance: 80, duration: 0.4 },
      push: { quantity: 4 }
    }
  },
  retina_detect: true,
  background: {
    color: "#f5f5f5"
  }
};

const OrangeParticlesBackground = () => {
  const particlesInit = useCallback(async (main) => {
    await loadFull(main);
  }, []);

  return (
    <Particles
  id="orange-particles-bg"
  init={particlesInit}
  options={{
    background: {
      color: "#0d0d0d" // solid dark background (no gradient)
    },
    particles: {
      number: {
        value: 60,
        density: { enable: true, value_area: 800 }
      },
      color: { value: ["#ffffff", "#2E8B57", "#FFD700"] }, // white, emerald, gold
      shape: {
        type: "circle" // professional & clean
      },
      opacity: {
        value: 0.7,
        random: false,
        anim: { enable: false }
      },
      size: {
        value: 3,
        random: true
      },
      line_linked: {
        enable: true,
        distance: 150,
        color: "#2E8B57", // emerald connection lines
        opacity: 0.4,
        width: 1
      },
      move: {
        enable: true,
        speed: 1,
        direction: "none",
        random: false,
        straight: false,
        out_mode: "out",
        attract: { enable: false }
      }
    },
    interactivity: {
      detect_on: "canvas",
      events: {
        onhover: { enable: true, mode: "repulse" }, // gentle hover ripple
        onclick: { enable: true, mode: "push" },   // burst effect
        resize: true
      },
      modes: {
        repulse: { distance: 100, duration: 0.4 },
        push: { particles_nb: 6 }
      }
    },
    retina_detect: true
  }}
/>

  );
};

export default OrangeParticlesBackground;
