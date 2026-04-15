'use client';

import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FolderOpen, Plus, StickyNote, Check, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Habit } from '@/types/app';
import { CATEGORY_LABELS } from './habit-constants';
import HabitCompactRow from './habit-compact-card';
import SortableItem from './sortable-habit-item';
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';

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
  onCreateHabit?: () => void;
  themeTick?: number;
}

export default function CategoryHabitsModal({
  open, onClose, category, habits, isAr, store, today, onEdit, onDetail, onCreateHabit, themeTick,
}: CategoryHabitsModalProps) {
  const catLabel = isAr
    ? (CATEGORY_LABELS[category]?.ar ?? category)
    : (CATEGORY_LABELS[category]?.en ?? category);

  // Sort habits by categoryViewOrder
  const sortedHabits = useMemo(() =>
    [...habits].sort((a, b) => ((a as any).categoryViewOrder ?? a.order ?? 999) - ((b as any).categoryViewOrder ?? b.order ?? 999)),
    [habits]
  );

  const habitIds = useMemo(() => sortedHabits.map(h => h.id), [sortedHabits]);

  // DnD
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = habitIds.indexOf(active.id as string);
    const newIndex = habitIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(habitIds, oldIndex, newIndex);
    store.reorderHabitsInCategory(reordered);
  }, [habitIds, store]);

  // Note state
  const [showNote, setShowNote] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const noteRef = useRef<HTMLTextAreaElement>(null);

  const savedNote: string = store.categoryNotes?.[category] ?? '';

  // Reset note state when modal opens/category changes
  useEffect(() => {
    if (open) {
      setNoteText(savedNote);
      setEditingNote(false);
      setShowNote(!!savedNote);
    }
  }, [open, category, savedNote]);

  const saveNote = () => {
    store.setCategoryNote(category, noteText.trim());
    setEditingNote(false);
    if (!noteText.trim()) setShowNote(false);
  };

  const startEditNote = () => {
    setNoteText(savedNote);
    setEditingNote(true);
    setShowNote(true);
    setTimeout(() => noteRef.current?.focus(), 100);
  };

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
          <div className="flex min-h-full items-center justify-center p-4">
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
                        ? `${habits.length} عادة في هذه الفئة • اسحب لإعادة الترتيب`
                        : `${habits.length} habit${habits.length === 1 ? '' : 's'} • Drag to reorder`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* Note button */}
                  <button
                    onClick={startEditNote}
                    className={cn(
                      'group h-8 px-3 rounded-xl flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-all duration-200',
                      savedNote
                        ? 'text-[var(--color-primary)] bg-[rgba(var(--color-primary-rgb)/0.08)] hover:bg-[rgba(var(--color-primary-rgb)/0.15)] hover:shadow-sm'
                        : 'text-[var(--foreground)]/40 bg-[var(--foreground)]/[0.04] hover:bg-[var(--foreground)]/[0.08] hover:text-[var(--foreground)]/60',
                    )}
                  >
                    <StickyNote className="h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110" />
                    {isAr ? 'ملاحظة' : 'Note'}
                    {savedNote && <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />}
                  </button>
                  {onCreateHabit && (
                    <button
                      onClick={onCreateHabit}
                      className="app-btn-primary h-8 px-3 rounded-xl flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {isAr ? 'عادة جديدة' : 'New Habit'}
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="h-9 w-9 rounded-xl flex items-center justify-center text-[var(--foreground)]/40 hover:text-[var(--foreground)]/70 hover:bg-[rgba(var(--color-primary-rgb)/0.06)] transition-all shrink-0 cursor-pointer"
                    style={{ border: '1px solid rgba(var(--color-primary-rgb)/0.08)' }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Note section */}
              <AnimatePresence>
                {showNote && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 sm:px-6 py-3" style={{ borderBottom: '1px solid rgba(var(--color-primary-rgb)/0.06)' }}>
                      <div className="app-card rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <StickyNote className="w-3 h-3 text-[var(--color-primary)]" />
                            <span className="text-[11px] font-bold text-[var(--foreground)]/50">
                              {isAr ? 'ملاحظة الفئة' : 'Category Note'}
                            </span>
                          </div>
                          {!editingNote && savedNote && (
                            <button
                              onClick={startEditNote}
                              className="flex items-center gap-1 text-[10px] font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary)]/80 cursor-pointer transition-colors"
                            >
                              <Pencil className="w-2.5 h-2.5" />
                              {isAr ? 'تعديل' : 'Edit'}
                            </button>
                          )}
                        </div>
                        {editingNote ? (
                          <div className="space-y-2">
                            <textarea
                              ref={noteRef}
                              value={noteText}
                              onChange={e => setNoteText(e.target.value)}
                              placeholder={isAr ? 'اكتب ملاحظة عن هذه الفئة...' : 'Write a note about this category...'}
                              className="w-full h-20 px-3 py-2 rounded-lg text-sm bg-[var(--color-background)] border-[1.5px] border-[rgba(var(--color-primary-rgb)/0.12)] text-[var(--foreground)] placeholder:text-[var(--foreground)]/25 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/25 focus:border-[var(--color-primary)]/30 transition-all resize-none"
                            />
                            <div className="flex items-center gap-2">
                              <button
                                onClick={saveNote}
                                className="app-btn-primary h-7 px-3 rounded-lg text-[11px] font-bold cursor-pointer flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                {isAr ? 'حفظ' : 'Save'}
                              </button>
                              <button
                                onClick={() => { setEditingNote(false); if (!savedNote) setShowNote(false); setNoteText(savedNote); }}
                                className="app-btn-secondary h-7 px-3 rounded-lg text-[11px] cursor-pointer"
                              >
                                {isAr ? 'إلغاء' : 'Cancel'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-[var(--foreground)]/60 leading-relaxed whitespace-pre-wrap">
                            {savedNote}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Habit cards with drag-and-drop */}
              <div className="px-4 sm:px-5 py-4 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 80px)' }}>
                {sortedHabits.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FolderOpen className="h-10 w-10 text-[var(--foreground)]/15 mb-3" />
                    <p className="text-sm text-[var(--foreground)]/40">
                      {isAr ? 'لا توجد عادات في هذه الفئة' : 'No habits in this category'}
                    </p>
                  </div>
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={habitIds} strategy={rectSortingStrategy}>
                      <div key={themeTick} className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                        {sortedHabits.map((habit, idx) => (
                          <SortableItem key={habit.id} id={habit.id}>
                            <div className="ps-8">
                              <HabitCompactRow
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
                            </div>
                          </SortableItem>
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
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
