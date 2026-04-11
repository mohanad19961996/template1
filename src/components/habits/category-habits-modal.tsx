'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Habit } from '@/types/app';
import { CATEGORY_LABELS } from './habit-constants';
import HabitCompactRow from './habit-compact-card';

interface CategoryHabitsModalProps {
  open: boolean;
  onClose: () => void;
  category: string;
  habits: Habit[];
  isAr: boolean;
  store: any;
  today: string;
  onEdit: (habit: Habit) => void;
  onDetail: (habit: Habit) => void;
  themeTick?: number;
}

export default function CategoryHabitsModal({
  open, onClose, category, habits, isAr, store, today, onEdit, onDetail, themeTick,
}: CategoryHabitsModalProps) {
  const catLabel = isAr
    ? (CATEGORY_LABELS[category]?.ar ?? category)
    : (CATEGORY_LABELS[category]?.en ?? category);

  const content = (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[var(--z-modal)] overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="flex min-h-full items-start justify-center p-4 pt-[6vh]">
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 16 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-3xl bg-[var(--color-card)] rounded-2xl overflow-hidden"
              style={{
                border: '1px solid rgba(var(--color-primary-rgb)/0.1)',
                boxShadow: '0 24px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(var(--color-primary-rgb)/0.04)',
              }}
            >
              {/* Top accent */}
              <div className="absolute top-0 inset-x-0 h-[2px] rounded-t-2xl"
                style={{ background: 'linear-gradient(90deg, transparent 10%, var(--color-primary), transparent 90%)' }} />

              {/* Header */}
              <div className="sticky top-0 z-10 bg-[var(--color-card)] flex items-center justify-between px-5 sm:px-6 py-4"
                style={{ borderBottom: '1px solid rgba(var(--color-primary-rgb)/0.08)' }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(var(--color-primary-rgb)/0.1)' }}>
                    <FolderOpen className="h-4.5 w-4.5 text-[var(--color-primary)]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold truncate">{catLabel}</h3>
                    <p className="text-xs text-[var(--foreground)]/45">
                      {isAr
                        ? `${habits.length} عادة في هذه الفئة`
                        : `${habits.length} habit${habits.length === 1 ? '' : 's'} in this category`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="h-9 w-9 rounded-xl flex items-center justify-center text-[var(--foreground)]/40 hover:text-[var(--foreground)]/70 hover:bg-[rgba(var(--color-primary-rgb)/0.06)] transition-all shrink-0"
                  style={{ border: '1px solid rgba(var(--color-primary-rgb)/0.08)' }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Habit cards */}
              <div className="px-4 sm:px-5 py-4 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 80px)' }}>
                {habits.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FolderOpen className="h-10 w-10 text-[var(--foreground)]/15 mb-3" />
                    <p className="text-sm text-[var(--foreground)]/40">
                      {isAr ? 'لا توجد عادات في هذه الفئة' : 'No habits in this category'}
                    </p>
                  </div>
                ) : (
                  <div key={themeTick} className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                    {habits.map((habit, idx) => (
                      <HabitCompactRow
                        key={habit.id}
                        habit={habit}
                        index={idx}
                        isAr={isAr}
                        store={store}
                        today={today}
                        onEdit={() => onEdit(habit)}
                        onArchive={() => store.toggleHabitArchive(habit.id)}
                        onDelete={() => store.deleteHabit(habit.id)}
                        onDetail={() => onDetail(habit)}
                        onViewPage={`/app/habits/${habit.id}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(content, document.body);
}
