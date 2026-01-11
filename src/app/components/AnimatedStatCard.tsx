"use client";
import { motion, useAnimation } from "framer-motion";
import { useEffect } from "react";

export function AnimatedStatCard({
  title,
  value,
  icon,
  color = "blue",
  delay = 0,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: "blue" | "green" | "pink" | "purple";
  delay?: number;
}) {
  const controls = useAnimation();
  const colors = {
    blue: "from-blue-500 to-cyan-400",
    green: "from-green-500 to-emerald-400",
    pink: "from-pink-500 to-rose-400",
    purple: "from-purple-500 to-violet-400",
  };

  useEffect(() => {
    const animate = async () => {
      await controls.start({
        scale: [1, 1.05, 1],
        transition: { duration: 0.5, delay },
      });
    };
    animate();
    const interval = setInterval(animate, 10000 + delay * 1000);
    return () => clearInterval(interval);
  }, [controls, delay]);

  return (
    <motion.div
      animate={controls}
      className={`bg-gradient-to-br ${colors[color]} rounded-xl p-6 shadow-lg backdrop-blur-sm`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white/80">{title}</p>
          <p className="mt-2 text-2xl font-bold text-white">{value}</p>
        </div>
        <motion.div
          animate={{
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          className="p-2 bg-white/20 rounded-lg"
        >
          {icon}
        </motion.div>
      </div>
    </motion.div>
  );
}
