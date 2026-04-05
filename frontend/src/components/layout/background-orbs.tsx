import { motion } from "framer-motion";

export function BackgroundOrbs() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_30%),radial-gradient(circle_at_82%_12%,rgba(245,158,11,0.09),transparent_24%),radial-gradient(circle_at_50%_100%,rgba(45,212,191,0.08),transparent_28%),linear-gradient(180deg,#f8f4ee_0%,#eef5fa_54%,#f5f8fb_100%)]" />
      <div className="absolute inset-0 bg-grid bg-[size:42px_42px] opacity-20" />
      <motion.div
        className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl"
        animate={{ x: [0, 40, 0], y: [0, 20, 0] }}
        transition={{ duration: 12, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-0 top-0 h-96 w-96 rounded-full bg-orange-300/16 blur-3xl"
        animate={{ x: [0, -30, 0], y: [0, 30, 0] }}
        transition={{ duration: 14, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-emerald-300/15 blur-3xl"
        animate={{ x: [0, 25, 0], y: [0, -20, 0] }}
        transition={{ duration: 16, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
    </div>
  );
}
