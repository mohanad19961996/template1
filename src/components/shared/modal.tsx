"use client";

import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export function Modal({ open, onClose, children, title }: ModalProps) {
  const handleEsc = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [open, handleEsc]);

  const content = (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Scroll wrapper */}
          <div className="flex min-h-full items-center justify-center p-4">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative w-full max-w-lg rounded-2xl bg-card"
            style={{
              border: "1px solid rgba(var(--color-primary-rgb) / 0.1)",
              boxShadow:
                "0 24px 80px rgba(0,0,0,0.2), 0 0 0 1px rgba(var(--color-primary-rgb) / 0.05)",
            }}
          >
            {/* Top accent line */}
            <div
              className="absolute top-0 inset-x-0 h-[2px] rounded-t-2xl"
              style={{
                background:
                  "linear-gradient(90deg, transparent, var(--color-primary), transparent)",
              }}
            />

            {/* Header */}
            {title && (
              <div
                className="flex items-center justify-between px-5 pt-4 pb-2.5"
                style={{
                  borderBottom:
                    "1px solid rgba(var(--color-primary-rgb) / 0.06)",
                }}
              >
                <h3 className="text-base font-semibold">{title}</h3>
                <button
                  onClick={onClose}
                  className="h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer"
                  style={{
                    background: "rgba(var(--color-primary-rgb) / 0.06)",
                    border: "1px solid rgba(var(--color-primary-rgb) / 0.08)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "rgba(var(--color-primary-rgb) / 0.12)";
                    e.currentTarget.style.borderColor =
                      "rgba(var(--color-primary-rgb) / 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      "rgba(var(--color-primary-rgb) / 0.06)";
                    e.currentTarget.style.borderColor =
                      "rgba(var(--color-primary-rgb) / 0.08)";
                  }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Body */}
            <div className="px-5 py-4">{children}</div>

            {/* Close button if no title */}
            {!title && (
              <button
                onClick={onClose}
                className="absolute top-3 end-3 h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer z-10"
                style={{
                  background: "rgba(var(--color-primary-rgb) / 0.06)",
                  border: "1px solid rgba(var(--color-primary-rgb) / 0.08)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    "rgba(var(--color-primary-rgb) / 0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    "rgba(var(--color-primary-rgb) / 0.06)";
                }}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );

  if (typeof document === "undefined") return null;
  return createPortal(content, document.body);
}
