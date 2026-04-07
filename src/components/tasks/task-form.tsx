'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Task, TaskStatus, TaskPriority } from '@/types/app';
import {
  Plus, X, Check, Trash2, ClipboardList,
} from 'lucide-react';
import { PRIORITY_CONFIG, STATUS_CONFIG, CATEGORY_PRESETS, COLOR_OPTIONS } from './task-constants';

// ═══════════════════════════════════════════════════════════
// FIELD LABEL
// ═══════════════════════════════════════════════════════════

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground)]/40">{children}</label>;
}

// ═══════════════════════════════════════════════════════════
// TASK FORM MODAL
// ═══════════════════════════════════════════════════════════

export default function TaskFormModal({
  showForm, editingTask, form, setForm, isAr,
  onClose, onSave, onDelete, addSubtask, addTag,
  habits,
}: {
  showForm: boolean;
  editingTask: Task | null;
  form: {
    titleEn: string; titleAr: string; descriptionEn: string; descriptionAr: string;
    status: TaskStatus; priority: TaskPriority;
    category: string; dueDate: string; dueTime: string; estimatedMinutes: string | number;
    tags: string[]; tagInput: string; notes: string; color: string;
    subtasks: { id: string; title: string; completed: boolean }[];
    newSubtask: string; linkedHabitId: string;
  };
  setForm: React.Dispatch<React.SetStateAction<typeof form>>;
  isAr: boolean;
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
  addSubtask: () => void;
  addTag: () => void;
  habits: { id: string; nameEn: string; nameAr: string; archived?: boolean }[];
}) {
  return (
    <AnimatePresence>
      {showForm && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[var(--z-overlay)] bg-black/40 backdrop-blur-md" />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed inset-x-4 top-[5%] z-[var(--z-modal)] max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--foreground)]/10 bg-[var(--color-background)] shadow-2xl sm:inset-x-0 sm:mx-auto sm:w-[600px]"
          >
            <div className="h-0.5 w-full shrink-0 bg-[var(--color-primary)]" aria-hidden />
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--foreground)]/10 bg-[var(--color-background)]/95 px-5 py-4 backdrop-blur-xl">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <ClipboardList className="h-5 w-5 text-[var(--color-primary)]" />
                {editingTask ? (isAr ? 'تعديل المهمة' : 'Edit Task') : (isAr ? 'مهمة جديدة' : 'New Task')}
              </h2>
              <button type="button" onClick={onClose}
                className="rounded-lg p-2 text-[var(--foreground)]/45 hover:bg-[var(--foreground)]/[0.06]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              {/* Titles */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <FieldLabel>{isAr ? 'العنوان (عربي)' : 'Title (Arabic)'}</FieldLabel>
                  <input dir="rtl" value={form.titleAr} onChange={e => setForm(f => ({ ...f, titleAr: e.target.value }))}
                    className="w-full rounded-xl border border-[var(--foreground)]/10 bg-[var(--color-background)] text-[var(--foreground)] px-3.5 py-2.5 text-sm focus:border-[var(--color-primary)]/40 focus:outline-none"
                    placeholder={isAr ? 'عنوان المهمة...' : 'Task title...'} />
                </div>
                <div>
                  <FieldLabel>{isAr ? 'العنوان (إنجليزي)' : 'Title (English)'}</FieldLabel>
                  <input dir="ltr" value={form.titleEn} onChange={e => setForm(f => ({ ...f, titleEn: e.target.value }))}
                    className="w-full rounded-xl border border-[var(--foreground)]/10 bg-[var(--color-background)] text-[var(--foreground)] px-3.5 py-2.5 text-sm focus:border-[var(--color-primary)]/40 focus:outline-none"
                    placeholder="Task title..." />
                </div>
              </div>

              {/* Description */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <FieldLabel>{isAr ? 'الوصف (عربي)' : 'Description (Arabic)'}</FieldLabel>
                  <textarea dir="rtl" value={form.descriptionAr} onChange={e => setForm(f => ({ ...f, descriptionAr: e.target.value }))}
                    rows={2} className="w-full resize-none rounded-xl border border-[var(--foreground)]/10 bg-[var(--color-background)] text-[var(--foreground)] px-3.5 py-2.5 text-sm focus:border-[var(--color-primary)]/40 focus:outline-none"
                    placeholder={isAr ? 'وصف اختياري...' : 'Optional...'} />
                </div>
                <div>
                  <FieldLabel>{isAr ? 'الوصف (إنجليزي)' : 'Description (English)'}</FieldLabel>
                  <textarea dir="ltr" value={form.descriptionEn} onChange={e => setForm(f => ({ ...f, descriptionEn: e.target.value }))}
                    rows={2} className="w-full resize-none rounded-xl border border-[var(--foreground)]/10 bg-[var(--color-background)] text-[var(--foreground)] px-3.5 py-2.5 text-sm focus:border-[var(--color-primary)]/40 focus:outline-none"
                    placeholder="Optional description..." />
                </div>
              </div>

              {/* Status */}
              <div>
                <FieldLabel>{isAr ? 'الحالة' : 'Status'}</FieldLabel>
                <div className="flex flex-wrap gap-1.5">
                  {(['todo', 'in-progress', 'completed', 'cancelled'] as const).map(s => (
                    <button key={s} onClick={() => setForm(f => ({ ...f, status: s }))}
                      className={cn('rounded-lg px-3 py-2 text-[11px] font-semibold transition-all',
                        form.status === s ? cn(STATUS_CONFIG[s].bg, STATUS_CONFIG[s].color, 'ring-1 ring-current/20') : 'bg-[var(--foreground)]/[0.05] text-[var(--foreground)]/50')}>
                      {isAr ? STATUS_CONFIG[s].ar : STATUS_CONFIG[s].en}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div>
                <FieldLabel>{isAr ? 'الأولوية' : 'Priority'}</FieldLabel>
                <div className="flex gap-1.5">
                  {(['low', 'medium', 'high', 'urgent'] as const).map(p => (
                    <button key={p} onClick={() => setForm(f => ({ ...f, priority: p }))}
                      className={cn('flex-1 rounded-lg py-2 text-[11px] font-semibold transition-all',
                        form.priority === p ? cn(PRIORITY_CONFIG[p].bg, PRIORITY_CONFIG[p].color, 'ring-1 ring-current/20') : 'bg-[var(--foreground)]/[0.05] text-[var(--foreground)]/50')}>
                      {isAr ? PRIORITY_CONFIG[p].ar : PRIORITY_CONFIG[p].en}
                    </button>
                  ))}
                </div>
              </div>

              {/* Due Date, Time, Estimate */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <FieldLabel>{isAr ? 'تاريخ الاستحقاق' : 'Due Date'}</FieldLabel>
                  <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                    className="w-full rounded-xl border border-[var(--foreground)]/10 bg-[var(--color-background)] text-[var(--foreground)] px-3 py-2.5 text-sm focus:border-[var(--color-primary)]/40 focus:outline-none" />
                  {!form.dueDate && (
                    <p className="mt-1 text-[10px] text-red-500/80 font-semibold">
                      {isAr ? '* مطلوب — حدد تاريخ استحقاق للمهمة' : '* Required — set a due date'}
                    </p>
                  )}
                </div>
                <div>
                  <FieldLabel>{isAr ? 'الوقت' : 'Time'}</FieldLabel>
                  <input type="time" value={form.dueTime} onChange={e => setForm(f => ({ ...f, dueTime: e.target.value }))}
                    className="w-full rounded-xl border border-[var(--foreground)]/10 bg-[var(--color-background)] text-[var(--foreground)] px-3 py-2.5 text-sm focus:border-[var(--color-primary)]/40 focus:outline-none" />
                </div>
                <div>
                  <FieldLabel>{isAr ? 'الوقت المقدر (دقيقة)' : 'Estimate (min)'}</FieldLabel>
                  <input type="number" min={1} value={form.estimatedMinutes} onChange={e => setForm(f => ({ ...f, estimatedMinutes: e.target.value }))}
                    placeholder="min" className="w-full rounded-xl border border-[var(--foreground)]/10 bg-[var(--color-background)] text-[var(--foreground)] px-3 py-2.5 text-sm focus:border-[var(--color-primary)]/40 focus:outline-none" />
                </div>
              </div>

              {/* Category */}
              <div>
                <FieldLabel>{isAr ? 'التصنيف' : 'Category'}</FieldLabel>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORY_PRESETS.map(c => (
                    <button key={c.en} onClick={() => setForm(f => ({ ...f, category: f.category === c.en ? '' : c.en }))}
                      className={cn('rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all',
                        form.category === c.en ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/20' : 'bg-[var(--foreground)]/[0.05] text-[var(--foreground)]/50')}>
                      {isAr ? c.ar : c.en}
                    </button>
                  ))}
                </div>
                <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  placeholder={isAr ? 'أو اكتب تصنيفاً...' : 'Or type custom...'}
                  className="mt-2 w-full rounded-xl border border-[var(--foreground)]/10 bg-[var(--color-background)] text-[var(--foreground)] px-3 py-2 text-xs focus:border-[var(--color-primary)]/40 focus:outline-none" />
              </div>

              {/* Tags */}
              <div>
                <FieldLabel>{isAr ? 'العلامات' : 'Tags'}</FieldLabel>
                {form.tags.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1">
                    {form.tags.map(t => (
                      <span key={t} className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--color-primary)]">
                        {t}
                        <button type="button" onClick={() => setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }))}><X className="h-2.5 w-2.5" /></button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input value={form.tagInput} onChange={e => setForm(f => ({ ...f, tagInput: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                    placeholder={isAr ? 'اكتب واضغط Enter...' : 'Type & press Enter...'}
                    className="flex-1 rounded-xl border border-[var(--foreground)]/10 bg-[var(--color-background)] text-[var(--foreground)] px-3 py-2 text-xs focus:border-[var(--color-primary)]/40 focus:outline-none" />
                  <button type="button" onClick={addTag} className="rounded-xl bg-[var(--foreground)]/[0.05] px-3 py-2 text-[var(--foreground)]/50 hover:bg-[var(--foreground)]/[0.1]">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Subtasks */}
              <div>
                <FieldLabel>{isAr ? 'المهام الفرعية' : 'Subtasks'}</FieldLabel>
                {form.subtasks.length > 0 && (
                  <div className="mb-2 space-y-1.5">
                    {form.subtasks.map(st => (
                      <div key={st.id} className="flex items-center gap-2 rounded-lg bg-[var(--foreground)]/[0.03] px-3 py-2">
                        <button type="button" onClick={() => setForm(f => ({ ...f, subtasks: f.subtasks.map(s => s.id === st.id ? { ...s, completed: !s.completed } : s) }))}
                          className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded-full border', st.completed ? 'border-emerald-500 bg-emerald-500' : 'border-[var(--foreground)]/25')}>
                          {st.completed && <Check className="h-2.5 w-2.5 text-white" />}
                        </button>
                        <span className={cn('flex-1 text-xs', st.completed && 'text-[var(--foreground)]/40 line-through')}>{st.title}</span>
                        <button type="button" onClick={() => setForm(f => ({ ...f, subtasks: f.subtasks.filter(s => s.id !== st.id) }))}
                          className="text-[var(--foreground)]/20 hover:text-red-400"><X className="h-3 w-3" /></button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input value={form.newSubtask} onChange={e => setForm(f => ({ ...f, newSubtask: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSubtask(); } }}
                    placeholder={isAr ? 'إضافة مهمة فرعية...' : 'Add subtask...'}
                    className="flex-1 rounded-xl border border-[var(--foreground)]/10 bg-[var(--color-background)] text-[var(--foreground)] px-3 py-2 text-sm focus:border-[var(--color-primary)]/40 focus:outline-none" />
                  <button type="button" onClick={addSubtask}
                    className="rounded-xl bg-[var(--foreground)]/[0.05] px-3 py-2 text-[var(--foreground)]/50 hover:bg-[var(--foreground)]/[0.1]">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <FieldLabel>{isAr ? 'ملاحظات' : 'Notes'}</FieldLabel>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  dir={isAr ? 'rtl' : 'ltr'} rows={2}
                  className="w-full resize-none rounded-xl border border-[var(--foreground)]/10 bg-[var(--color-background)] text-[var(--foreground)] px-3.5 py-2.5 text-sm focus:border-[var(--color-primary)]/40 focus:outline-none"
                  placeholder={isAr ? 'ملاحظات إضافية...' : 'Additional notes...'} />
              </div>

              {/* Color */}
              <div>
                <FieldLabel>{isAr ? 'اللون' : 'Color'}</FieldLabel>
                <div className="flex gap-2">
                  {COLOR_OPTIONS.map(c => (
                    <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                      className={cn('h-7 w-7 rounded-full border-2 transition-all', form.color === c ? 'scale-110 border-[var(--foreground)]/50' : 'border-transparent')}
                      style={{ background: c === 'theme' ? 'var(--color-primary)' : c }} />
                  ))}
                </div>
              </div>

              {/* Linked Habit */}
              {habits.length > 0 && (
                <div>
                  <FieldLabel>{isAr ? 'ربط بعادة' : 'Linked Habit'}</FieldLabel>
                  <select value={form.linkedHabitId} onChange={e => setForm(f => ({ ...f, linkedHabitId: e.target.value }))}
                    className="w-full rounded-xl border border-[var(--foreground)]/10 bg-[var(--color-background)] text-[var(--foreground)] px-3 py-2.5 text-sm focus:border-[var(--color-primary)]/40 focus:outline-none">
                    <option value="">{isAr ? 'بدون ربط' : 'None'}</option>
                    {habits.filter(h => !h.archived).map(h => (
                      <option key={h.id} value={h.id}>{isAr ? (h.nameAr || h.nameEn) : (h.nameEn || h.nameAr)}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-[var(--foreground)]/10 bg-[var(--color-background)] p-5">
              {editingTask && (
                <button type="button" onClick={onDelete}
                  className="flex items-center gap-1 text-xs text-red-400 hover:text-red-500">
                  <Trash2 className="h-3.5 w-3.5" /> {isAr ? 'حذف' : 'Delete'}
                </button>
              )}
              <div className="ms-auto flex gap-3">
                <button type="button" onClick={onClose}
                  className="rounded-xl px-4 py-2.5 text-sm text-[var(--foreground)]/50 hover:bg-[var(--foreground)]/[0.05]">
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="button" onClick={onSave} disabled={(!form.titleEn && !form.titleAr) || !form.dueDate}
                  className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-md disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.8))' }}>
                  {editingTask ? (isAr ? 'تحديث' : 'Update') : (isAr ? 'إنشاء' : 'Create')}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
