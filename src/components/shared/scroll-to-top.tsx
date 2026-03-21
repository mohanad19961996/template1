"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollUp = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={scrollUp}
          aria-label="Scroll to top"
          className="fixed z-[var(--z-fixed)] bottom-6 cursor-pointer h-10 w-10 rounded-full flex items-center justify-center"
          style={{
            insetInlineEnd: "1.5rem",
            background: "var(--color-primary)",
            color: "var(--color-primary-foreground)",
            boxShadow:
              "0 4px 16px rgba(var(--color-primary-rgb) / 0.3), 0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <ArrowUp className="h-4.5 w-4.5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
