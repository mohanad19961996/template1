'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import { useToast } from '@/components/app/toast-notifications';
import { Plus, X, Check, Edit3, GripVertical, Tag } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CATEGORY_LABELS, categoryTileBase } from '@/components/habits/habit-constants';

export function NewCategoryTile({ isAr, store, allCategories }: { isAr: boolean; store: ReturnType<typeof useAppStore>; allCategories: string[] }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const exists = allCategories.some(c => c.toLowerCase() === value.trim().toLowerCase() || (CATEGORY_LABELS[c]?.en ?? '').toLowerCase() === value.trim().toLowerCase() || (CATEGORY_LABELS[c]?.ar ?? '') === value.trim());
  const canCreate = value.trim().length > 0 && !exists;

  const handleCreate = () => {
    if (!canCreate) return;
    store.addCustomCategory(value.trim());
    setValue('');
    setEditing(false);
  };

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  if (editing) {
    return (
      <div
        className={cn(categoryTileBase, 'border-dashed border-[var(--color-primary)]/40 bg-[var(--color-primary)]/[0.05] !gap-1')}
      >
        <input
          ref={inputRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleCreate();
            if (e.key === 'Escape') { setEditing(false); setValue(''); }
          }}
          onBlur={() => { if (!value.trim()) { setEditing(false); setValue(''); } }}
          placeholder={isAr ? 'اسم الفئة...' : 'Name...'}
          className="w-full bg-transparent text-[10px] font-bold outline-none placeholder:text-[var(--foreground)]/35 sm:text-[11px]"
        />
        <div className="flex items-center justify-between gap-1 border-t border-[var(--foreground)]/[0.1] pt-1">
          <button
            type="button"
            onClick={() => { setEditing(false); setValue(''); }}
            className="text-[8px] font-bold text-[var(--foreground)]/40 hover:text-[var(--foreground)]/70 sm:text-[9px]"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!canCreate}
            className={cn(
              'rounded px-1.5 py-px text-[10px] font-black sm:text-xs',
              canCreate
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--foreground)]/[0.08] text-[var(--foreground)]/30',
            )}
          >
            {isAr ? 'إضافة' : 'Add'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={cn(
        categoryTileBase,
        'border-dashed border-[var(--foreground)]/[0.12] bg-[var(--foreground)]/[0.02] text-[var(--foreground)] hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/[0.06]',
      )}
    >
      <Plus className="h-3.5 w-3.5 shrink-0 opacity-40" style={{ color: 'var(--color-primary)' }} />
      <span className="text-[10px] font-bold text-[var(--foreground)]/50">
        {isAr ? 'فئة جديدة' : 'New'}
      </span>
    </button>
  );
}

export function useOrderedCategories(allCategories: string[], categoryOrder: string[] | undefined) {
  return useMemo(() => {
    const order = categoryOrder ?? [];
    if (order.length === 0) return allCategories;
    const ordered = order.filter(c => allCategories.includes(c));
    const remaining = allCategories.filter(c => !order.includes(c));
    return [...ordered, ...remaining];
  }, [allCategories, categoryOrder]);
}

/** Sortable category tile for inline editing inside CategoryChipsRail */
export function SortableCategoryTile({ id, label, count, isSelected, isEditMode, canDelete, onSelect, onDelete, onRename, isAr }: {
  id: string; label: string; count: number; isSelected: boolean; isEditMode: boolean; canDelete: boolean | 'has_habits';
  onSelect: () => void; onDelete: () => void; onRename: (newName: string) => void; isAr: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: !isEditMode });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : undefined, opacity: isDragging ? 0.7 : 1 };
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(label);
  const renameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (isRenaming) renameRef.current?.focus(); }, [isRenaming]);
  useEffect(() => { if (!isEditMode) { setIsRenaming(false); setRenameValue(label); } }, [isEditMode, label]);

  const commitRename = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== label && trimmed !== id) {
      onRename(trimmed);
    }
    setIsRenaming(false);
    setRenameValue(label);
  };

  if (isEditMode && isRenaming) {
    return (
      <div ref={setNodeRef} style={style} className={cn(categoryTileBase, 'border-[var(--color-primary)]/30 bg-[var(--color-primary)]/[0.05] !gap-1')}>
        <input
          ref={renameRef}
          value={renameValue}
          onChange={e => setRenameValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') { setIsRenaming(false); setRenameValue(label); } }}
          onBlur={commitRename}
          className="w-full bg-transparent text-[10px] font-bold outline-none placeholder:text-[var(--foreground)]/35 sm:text-[11px]"
          placeholder={isAr ? 'اسم جديد...' : 'New name...'}
        />
        <button onClick={commitRename} className="shrink-0 text-[var(--color-primary)] self-end">
          <Check className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} className="relative group/cat-tile">
      <button
        type="button"
        onClick={isEditMode ? () => { setRenameValue(label); setIsRenaming(true); } : onSelect}
        className={cn(
          categoryTileBase, 'w-full',
          isEditMode
            ? 'border-dashed border-[var(--foreground)]/20 bg-[var(--foreground)]/[0.02] text-[var(--foreground)] cursor-pointer hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/[0.04]'
            : isSelected
              ? 'border-[var(--color-primary)] text-white shadow-sm'
              : 'border-[var(--foreground)]/[0.1] bg-[var(--foreground)]/[0.015] text-[var(--foreground)] hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/[0.06]',
        )}
        style={!isEditMode && isSelected ? { background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.8))' } : undefined}
      >
        {isEditMode && (
          <span {...attributes} {...listeners} className="shrink-0 cursor-grab active:cursor-grabbing text-[var(--foreground)]/40 hover:text-[var(--foreground)]/70">
            <GripVertical className="h-3 w-3" />
          </span>
        )}
        <span className="whitespace-nowrap text-[11px] font-bold">
          {label}
          {isEditMode && <Edit3 className="inline h-2.5 w-2.5 ms-1 opacity-40" />}
        </span>
        {!isEditMode && (
          <span className={cn('shrink-0 ms-auto rounded-full px-1.5 py-px text-[10px] font-black tabular-nums', isSelected ? 'bg-white/25 text-white' : 'bg-[var(--foreground)]/[0.07] text-[var(--foreground)]/60')}>
            {count}
          </span>
        )}
      </button>
      {isEditMode && (
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className={cn('absolute -top-1.5 -end-1.5 h-5 w-5 rounded-full flex items-center justify-center transition-all shadow-sm z-10',
            canDelete === true
              ? 'bg-red-500 text-white hover:bg-red-600 hover:scale-110'
              : 'bg-gray-400 text-white cursor-not-allowed opacity-60')}
          title={canDelete === 'has_habits'
            ? (isAr ? 'لا يمكن الحذف — عادات تستخدم هذه الفئة' : 'Cannot delete — habits use this category')
            : canDelete === true ? (isAr ? 'حذف الفئة' : 'Delete category') : ''}>
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

/** Multi-row category grid with inline edit/drag/rename/delete -- sits above habit cards */
function CategoryChipsRail({ isAr, allCategories, filterCategory, setFilterCategory, showArchived, store, toast }: {
  isAr: boolean;
  allCategories: string[];
  filterCategory: string;
  setFilterCategory: (cat: string) => void;
  showArchived: boolean;
  store: ReturnType<typeof useAppStore>;
  toast: ReturnType<typeof useToast>;
}) {
  const [isEditMode, setIsEditMode] = useState(false);
  const orderedCategories = useOrderedCategories(allCategories, store.categoryOrder);
  const habitPool = useMemo(
    () => (showArchived ? store.habits.filter(h => h.archived) : store.habits.filter(h => !h.archived)),
    [store.habits, showArchived],
  );
  const totalAll = habitPool.length;
  const countFor = useCallback((cat: string) => habitPool.filter(h => h.category === cat).length, [habitPool]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedCategories.indexOf(active.id as string);
    const newIndex = orderedCategories.indexOf(over.id as string);
    const newOrder = arrayMove(orderedCategories, oldIndex, newIndex);
    store.reorderCategories(newOrder);
  }, [orderedCategories, store]);

  const handleDelete = useCallback((category: string) => {
    const activeHabitsInCategory = store.habits.filter(h => !h.archived && h.category === category);
    if (activeHabitsInCategory.length > 0) {
      toast.notifyWarning(
        isAr ? 'لا يمكن حذف الفئة' : 'Cannot delete category',
        isAr
          ? `${activeHabitsInCategory.length} عادة نشطة تستخدم هذه الفئة. غيّر فئتها أولاً`
          : `${activeHabitsInCategory.length} active habit${activeHabitsInCategory.length > 1 ? 's' : ''} use this category. Move them first`
      );
      return;
    }
    store.deleteCustomCategory(category);
    if (filterCategory === category) setFilterCategory('all');
    toast.notifySuccess(isAr ? 'تم حذف الفئة' : 'Category deleted');
  }, [store, isAr, filterCategory, setFilterCategory, toast]);

  const handleRename = useCallback((oldName: string, newName: string) => {
    store.renameCategory(oldName, newName);
    if (filterCategory === oldName) setFilterCategory(newName);
    toast.notifySuccess(isAr ? 'تم تغيير اسم الفئة' : 'Category renamed', newName);
  }, [store, isAr, filterCategory, setFilterCategory, toast]);

  const getDeleteStatus = useCallback((category: string): boolean | 'has_habits' => {
    const activeHabitsInCategory = store.habits.filter(h => !h.archived && h.category === category);
    if (activeHabitsInCategory.length > 0) return 'has_habits';
    return true;
  }, [store.habits]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="min-w-0 flex-1"
    >
      <div
        className="overflow-hidden rounded-xl border-2 shadow-sm"
        style={{
          borderColor: isEditMode ? 'rgba(var(--color-primary-rgb) / 0.3)' : 'rgba(var(--color-primary-rgb) / 0.14)',
          background: 'linear-gradient(180deg, rgba(var(--color-primary-rgb) / 0.04) 0%, var(--color-background) 40%)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.05) inset, 0 4px 18px -6px rgba(0,0,0,0.07)',
        }}
      >
        <div
          className="flex items-center gap-2 border-b-2 px-2.5 py-2 sm:px-3 sm:py-2"
          style={{ borderColor: 'rgba(var(--color-primary-rgb) / 0.1)', background: 'rgba(var(--color-primary-rgb) / 0.04)' }}
        >
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border sm:h-8 sm:w-8"
            style={{
              borderColor: 'rgba(var(--color-primary-rgb) / 0.2)',
              background: 'rgba(var(--color-primary-rgb) / 0.08)',
            }}
          >
            <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: 'var(--color-primary)' }} strokeWidth={2.25} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black tracking-tight text-[var(--foreground)] sm:text-[13px]">
              {isEditMode ? (isAr ? 'تعديل الفئات' : 'Edit categories') : (isAr ? 'تصفية حسب الفئة' : 'Filter by category')}
            </p>
            <p className="text-[9px] font-semibold leading-tight text-[var(--foreground)]/40 sm:text-[10px]">
              {isEditMode
                ? (isAr ? 'اسحب لإعادة الترتيب • اضغط للتسمية • ✕ للحذف' : 'Drag to reorder • Click to rename • ✕ to delete')
                : (isAr ? 'اختر فئة أو اعرض الكل' : 'Pick one category or show all')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsEditMode(e => !e)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-bold transition-all duration-150 sm:text-[11px]',
              isEditMode
                ? 'border-transparent text-white shadow-md'
                : 'border-[var(--foreground)]/[0.15] text-[var(--foreground)]/60 hover:border-[var(--color-primary)]/25 hover:bg-[var(--color-primary)]/[0.05] hover:text-[var(--color-primary)]',
            )}
            style={isEditMode ? { background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.8))' } : undefined}
          >
            {isEditMode ? <Check className="h-3 w-3" /> : <Edit3 className="h-3 w-3" />}
            {isEditMode ? (isAr ? 'تم' : 'Done') : (isAr ? 'تعديل' : 'Edit')}
          </button>
        </div>

        <div className="p-2 sm:p-2.5">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={orderedCategories} strategy={rectSortingStrategy}>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {/* "All" chip -- not draggable, always first */}
                {!isEditMode && (
                  <button
                    type="button"
                    onClick={() => setFilterCategory('all')}
                    className={cn(
                      categoryTileBase,
                      filterCategory === 'all'
                        ? 'border-[var(--color-primary)] text-white shadow-sm'
                        : 'border-[var(--foreground)]/[0.1] bg-[var(--foreground)]/[0.015] text-[var(--foreground)] hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/[0.06]',
                    )}
                    style={
                      filterCategory === 'all'
                        ? { background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.8))' }
                        : undefined
                    }
                  >
                    <span className="text-[11px] font-bold">
                      {isAr ? 'الكل' : 'All'}
                    </span>
                    <span className={cn('shrink-0 ms-auto rounded-full px-1.5 py-px text-[10px] font-black tabular-nums', filterCategory === 'all' ? 'bg-white/25 text-white' : 'bg-[var(--foreground)]/[0.07] text-[var(--foreground)]/60')}>
                      {totalAll}
                    </span>
                  </button>
                )}

                {orderedCategories.map(c => {
                  const label = isAr ? (CATEGORY_LABELS[c]?.ar ?? c) : (CATEGORY_LABELS[c]?.en ?? c);
                  const n = countFor(c);
                  const isSelected = filterCategory === c;
                  return (
                    <SortableCategoryTile
                      key={c}
                      id={c}
                      label={label}
                      count={n}
                      isSelected={isSelected}
                      isEditMode={isEditMode}
                      canDelete={getDeleteStatus(c)}
                      onSelect={() => setFilterCategory(c)}
                      onDelete={() => handleDelete(c)}
                      onRename={(newName) => handleRename(c, newName)}
                      isAr={isAr}
                    />
                  );
                })}

                <NewCategoryTile isAr={isAr} store={store} allCategories={allCategories} />
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </motion.div>
  );
}

export default CategoryChipsRail;
