"use client";

import React from "react";
import { motion, Variants } from "framer-motion";

export default function DashboardTemplate({ children }: { children: React.ReactNode }) {

  // FIX TẠI ĐÂY: Khai báo type Variants
  const variants: Variants = {
    hidden: {
      opacity: 0,
      y: 15
    },
    enter: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring", // Không còn báo lỗi đỏ nữa
        stiffness: 300,
        damping: 30,
        mass: 1
      }
    },
  };

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="enter"
      className="flex-1 flex flex-col w-full h-full relative"
    >
      {children}
    </motion.div>
  );
}