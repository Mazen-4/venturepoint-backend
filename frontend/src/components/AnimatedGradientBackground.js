import React from "react";
import { motion } from "framer-motion";

// Animated gradient background using Framer Motion and CSS
const AnimatedGradientBackground = () => {
  return (
    <motion.div
      aria-hidden
      initial={{ backgroundPosition: "0% 50%" }}
      animate={{ backgroundPosition: [
        "0% 50%",
        "100% 50%",
        "0% 50%"
      ] }}
      transition={{
        duration: 16,
        repeat: Infinity,
        ease: "linear"
      }}
      className="fixed inset-0 z-0 w-full h-full pointer-events-none"
      style={{
        background: "linear-gradient(120deg, #002147 0%, #2E7D32 50%, #C9A635 100%)",
        backgroundSize: "200% 200%",
        opacity: 0.18,
      }}
    />
  );
};

export default AnimatedGradientBackground;
