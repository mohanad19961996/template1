"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "@/i18n/navigation";
import { motion, AnimatePresence } from "framer-motion";

export function NavigationLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const currentPath = useRef(pathname);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

      try {
        const url = new URL(href, window.location.origin);
        if (url.pathname === window.location.pathname) return;
      } catch { return; }

      setLoading(true);
      setProgress(5);

      if (intervalRef.current) clearInterval(intervalRef.current);
      let p = 5;
      intervalRef.current = setInterval(() => {
        p += Math.random() * 10 + 2;
        if (p > 85) { p = 85; if (intervalRef.current) clearInterval(intervalRef.current); }
        setProgress(p);
      }, 250);
    };

    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (pathname !== currentPath.current) {
      currentPath.current = pathname;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (loading) {
        setProgress(100);
        const t = setTimeout(() => { setLoading(false); setProgress(0); }, 300);
        return () => clearTimeout(t);
      }
    }
  }, [pathname, loading]);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-[9999] h-[2.5px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div className="absolute inset-0" style={{ background: "rgba(var(--color-primary-rgb) / 0.06)" }} />
          <motion.div
            className="h-full relative overflow-hidden"
            style={{
              background: "linear-gradient(90deg, rgba(var(--color-primary-rgb) / 0.5), var(--color-primary), rgba(var(--color-primary-rgb) / 0.7))",
            }}
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)",
                backgroundSize: "200% 100%",
                animation: "textShimmer 1s linear infinite",
              }}
            />
            <div
              className="absolute top-0 right-0 h-full w-16"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(var(--color-primary-rgb) / 0.8))",
                boxShadow: "0 0 10px rgba(var(--color-primary-rgb) / 0.5)",
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
