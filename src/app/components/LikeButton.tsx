"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, ChevronUp } from "lucide-react";

export function LikeButton({
  isLiked,
  likeCount,
  onLike,
  onUnlike,
  className = "",
}: {
  isLiked: boolean;
  likeCount: number;
  onLike: () => void;
  onUnlike: () => void;
  className?: string;
}) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    if (isAnimating) return;

    setIsAnimating(true);
    if (isLiked) {
      onUnlike();
    } else {
      onLike();
    }
    setTimeout(() => setIsAnimating(false), 500);
  };

  return (
    <div className={`relative flex items-center gap-1 ${className}`}>
      <motion.button
        onClick={handleClick}
        disabled={isAnimating}
        className={`p-2 rounded-full focus:outline-none z-10 ${
          isLiked
            ? "text-pink-500 hover:text-pink-400"
            : "text-gray-400 hover:text-white"
        }`}
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.1 }}
      >
        <motion.div
          key={isLiked ? "liked" : "not-liked"}
          initial={{ scale: 1 }}
          animate={{
            scale: [1, 1.2, 1],
            rotate: isLiked ? [0, -10, 10, 0] : 0,
          }}
          transition={{ duration: 0.5 }}
        >
          <Heart
            className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`}
            strokeWidth={isLiked ? 2 : 1.5}
          />
        </motion.div>
      </motion.button>

      <motion.span
        className={`font-medium text-sm z-10 ${
          isLiked ? "text-pink-500" : "text-gray-400"
        }`}
        key={likeCount}
        initial={{ y: 0, opacity: 1 }}
        animate={{
          y: isLiked ? [-5, 0] : 0,
          opacity: [0.5, 1],
          scale: [0.8, 1.1, 1],
        }}
        transition={{ duration: 0.3 }}
      >
        {likeCount}
      </motion.span>

      {!isLiked && (
        <motion.div
          className="absolute -right-2 -top-2 bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center z-20"
          initial={{ scale: 0 }}
          animate={{
            scale: [0, 1.2, 1],
            opacity: [0, 1, 1],
          }}
          transition={{
            delay: 2,
            repeat: Infinity,
            repeatType: "reverse",
            repeatDelay: 3,
            duration: 1.5,
          }}
        >
          <ChevronUp className="w-3 h-3" />
        </motion.div>
      )}
    </div>
  );
}
