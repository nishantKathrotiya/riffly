"use client";
import {
  motion,
  useAnimation,
  useMotionValue,
  useTransform,
  animate,
  useMotionTemplate,
} from "framer-motion";
import { useEffect, useState } from "react";

const AnimatedNumber = ({ value }: { value: string | number }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, Math.round);
  const [isHovered, setIsHovered] = useState(false);

  // Flicker effect values
  const flicker = useAnimation();

  useEffect(() => {
    if (typeof value === "number") {
      const animation = animate(count, value, {
        duration: 2,
        ease: "easeOut",
      });
      return () => animation.stop();
    }
  }, [value]);

  // Flicker effect on hover
  // Update the flicker effect in the second useEffect
  useEffect(() => {
    if (isHovered) {
      flicker.start({
        opacity: [0.5, 0, 0.7, 1, 0], // Lower max opacity (less intense flickering)
        textShadow: [
          "0 0 1px #ffffff, 0 0 3px #ffffff, 0 0 6px #ffffff", // Softer shadow
          "0 0 2px #ffffff, 0 0 5px #ffffff, 0 0 8px #ffffff", // Slightly less intense glow
          "0 0 1px #ffffff, 0 0 3px #ffffff, 0 0 5px #ffffff", // Subtle shadow and glow
        ],
        transition: {
          duration: 1, // Slower transition to make flicker less harsh
          repeat: Infinity,
          repeatType: "reverse",
        },
      });
    } else {
      flicker.start({
        opacity: 1,
        textShadow: "0 0 2px rgba(240, 240, 240, 0.2)", // Softer glow when not hovered
        transition: { duration: 0.5 },
      });
    }
  }, [isHovered]);

  // Update the motion.span style
  <motion.span
    className="relative z-10 text-6xl font-black"
    animate={flicker}
    style={{
      WebkitTextStroke: "1px #ffeb3b", // Yellow outline
      color: "#fff8c4", // Warm white color
      display: "inline-block",
      padding: "0.5rem 1rem",
      position: "relative",
      textShadow: "0 0 5px rgba(255, 235, 59, 0.3)", // Initial subtle glow
    }}
  >
    {typeof value === "number" ? <motion.span>{rounded}</motion.span> : value}
  </motion.span>;

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Spider web decoration */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPgogIDxwYXR0ZXJuIGlkPSJ3ZWIiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CiAgICA8cGF0aCBkPSJNIDAgMCBMIDAgNDAgTCA0MCA0MCBMIDQwIDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz4KICAgIDxwYXRoIGQ9Ik0gMCAwIEMgMTAgMTAgMzAgMTAgNDAgMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPgogICAgPHBhdGggZD0iTSA0MCAwIEMgMzAgMTAgMTAgMTAgMCAwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIxIi8+CiAgPC9wYXR0ZXJuPgogIDxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjd2ViKSIvPgo8L3N2Zz4=')]" />
      </div>

      <motion.span
        className="relative z-10 text-6xl font-black"
        animate={flicker}
        style={{
          WebkitTextStroke: "1px #fff",
          color: "transparent",
          display: "inline-block",
          padding: "0.5rem 1rem",
          position: "relative",
        }}
      >
        {typeof value === "number" ? (
          <motion.span>{rounded}</motion.span>
        ) : (
          value
        )}
      </motion.span>
    </div>
  );
};

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
  const [isHovered, setIsHovered] = useState(false);

  const colors = {
    blue: {
      bg: "from-blue-900/80 to-blue-700/80",
      border: "border-blue-500/20",
      gradient: "from-blue-500 via-cyan-400 to-blue-600",
      shadow: "shadow-blue-500/20",
    },
    green: {
      bg: "from-emerald-900/80 to-green-700/80",
      border: "border-green-500/20",
      gradient: "from-green-500 via-emerald-400 to-green-600",
      shadow: "shadow-green-500/20",
    },
    pink: {
      bg: "from-rose-900/80 to-pink-700/80",
      border: "border-pink-500/20",
      gradient: "from-pink-500 via-rose-400 to-pink-600",
      shadow: "shadow-pink-500/20",
    },
    purple: {
      bg: "from-violet-900/80 to-purple-700/80",
      border: "border-purple-500/20",
      gradient: "from-purple-500 via-violet-400 to-purple-600",
      shadow: "shadow-purple-500/20",
    },
  };

  useEffect(() => {
    const animate = async () => {
      await controls.start({
        y: [0, -5, 0],
        transition: {
          duration: 3,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "reverse",
        },
      });
    };
    animate();
  }, [controls]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`relative overflow-hidden rounded-2xl p-0.5 ${
        colors[color].shadow
      } transition-all duration-300 hover:shadow-xl hover:${colors[
        color
      ].shadow.replace("20", "40")}`}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div className="absolute inset-0.5 rounded-2xl bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div
        className={`relative z-10 h-full rounded-2xl bg-gradient-to-br ${colors[color].bg} backdrop-blur-lg border ${colors[color].border} overflow-hidden`}
      >
        {/* Animated grid pattern */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                />
              </pattern>
              <linearGradient
                id="grid-gradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.5" />
                <stop
                  offset="100%"
                  stopColor="currentColor"
                  stopOpacity="0.1"
                />
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            <rect width="100%" height="100%" fill="url(#grid-gradient)" />
          </svg>
        </div>

        {/* Animated gradient background */}
        <motion.div
          className="absolute inset-0"
          animate={{
            backgroundPosition: isHovered ? ["0% 50%", "100% 50%"] : "0% 50%",
            opacity: isHovered ? 0.25 : 0.15,
          }}
          transition={{
            duration: 3,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "reverse",
          }}
          style={{
            backgroundImage: `radial-gradient(circle at 20% 30%, ${
              colors[color].gradient.split(" ")[0]
            } 0%, transparent 40%), 
                            radial-gradient(circle at 80% 70%, ${
                              colors[color].gradient.split(" ")[2]
                            } 0%, transparent 40%)`,
            backgroundSize: "200% 200%",
            mixBlendMode: "overlay",
          }}
        />

        {/* Floating particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            initial={{
              x: Math.random() * 100,
              y: Math.random() * 100,
              width: Math.random() * 4 + 2,
              height: Math.random() * 4 + 2,
              opacity: Math.random() * 0.5 + 0.1,
              background: `linear-gradient(45deg, ${
                colors[color].gradient.split(" ")[0]
              }, ${colors[color].gradient.split(" ")[2]})`,
            }}
            animate={{
              y: [
                Math.random() * 20 - 10,
                Math.random() * 20 + 20,
                Math.random() * 20 - 10,
              ],
              x: [
                Math.random() * 20 - 10,
                Math.random() * 20 - 10,
                Math.random() * 20 - 10,
              ],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: Math.random() * 10 + 5,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          />
        ))}

        <div className="relative z-20 p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-white/80">{title}</p>
              <motion.p
                className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: delay + 0.2 }}
              >
                <AnimatedNumber value={value} />
              </motion.p>
            </div>

            <motion.div
              className={`p-3 rounded-xl backdrop-blur-sm ${
                isHovered ? "bg-white/20 scale-110" : "bg-white/10 scale-100"
              } transition-all duration-300`}
              animate={{
                rotate: isHovered ? [0, 5, -5, 0] : 0,
                y: isHovered ? [0, -5, 5, 0] : 0,
              }}
              transition={{
                duration: 2,
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "reverse",
              }}
            >
              {icon}
            </motion.div>
          </div>

          {/* Decorative elements */}
          <div className="absolute -right-10 -bottom-10 w-32 h-32 rounded-full bg-white/5 blur-xl" />
          <div className="absolute -left-5 -top-5 w-20 h-20 rounded-full bg-white/5 blur-xl" />
        </div>

        {/* Animated border highlight */}
        <motion.div
          className="absolute inset-0 rounded-2xl"
          style={{
            boxShadow: `inset 0 0 20px 0 ${colors[color].border
              .replace("border-", "")
              .replace("/20", "/10")}`,
          }}
          animate={{
            boxShadow: [
              `inset 0 0 20px 0 ${colors[color].border
                .replace("border-", "")
                .replace("/20", "/10")}`,
              `inset 0 0 30px 0 ${colors[color].border
                .replace("border-", "")
                .replace("/20", "/30")}`,
              `inset 0 0 20px 0 ${colors[color].border
                .replace("border-", "")
                .replace("/20", "/10")}`,
            ],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
      </div>
    </motion.div>
  );
}
