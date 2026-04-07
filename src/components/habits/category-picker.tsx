'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import { ChevronDown, CheckCircle2, Plus } from 'lucide-react';
import { CATEGORY_LABELS } from '@/components/habits/habit-constants';

function CategoryPicker({ isAr, allCategories, value, onChange, store }: { isAr: boolean; allCategories: string[]; value: string; onChange: (cat: string) => void; store: ReturnType<typeof useAppStore> }) {
  const [catOpen, setCatOpen] = useState(false);
  const [catSearch, setCatSearch] = useState('');
  const catRef = useRef<HTMLDivElement>(null);
  const catInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const currentLabel = CATEGORY_LABELS[value]
    ? (isAr ? CATEGORY_LABELS[value].ar : CATEGORY_LABELS[value].en)
    : value;

  const filtered = allCategories.filter(c => {
    if (!catSearch) return true;
    const label = isAr ? (CATEGORY_LABELS[c]?.ar ?? c) : (CATEGORY_LABELS[c]?.en ?? c);
    return label.toLowerCase().includes(catSearch.toLowerCase()) || c.toLowerCase().includes(catSearch.toLowerCase());
  });

  const isNewCategory = catSearch.trim() && !allCategories.includes(catSearch.trim().toLowerCase()) && !allCategories.some(c => {
    const label = isAr ? (CATEGORY_LABELS[c]?.ar ?? c) : (CATEGORY_LABELS[c]?.en ?? c);
    return label.toLowerCase() === catSearch.trim().toLowerCase() || c === catSearch.trim();
  });

  return (
    <div ref={catRef} className="relative">
      <button type="button" onClick={() => { setCatOpen(!catOpen); setCatSearch(''); setTimeout(() => catInputRef.current?.focus(), 50); }}
        className={cn('app-input w-full rounded-xl bg-transparent px-3 py-2.5 text-sm flex items-center justify-between gap-2 transition-all',
          catOpen && 'ring-2 ring-[var(--color-primary)]/30')}>
        <span className="truncate">{currentLabel}</span>
        <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 text-[var(--foreground)] transition-transform duration-200', catOpen && 'rotate-180')} />
      </button>
      {catOpen && (
        <div className="absolute top-full mt-1.5 z-50 w-full rounded-2xl overflow-hidden shadow-2xl ring-1 ring-[var(--foreground)]/[0.18]" style={{ background: 'var(--color-background)' }}>
          <div className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg, transparent, var(--color-primary), transparent)' }} />
          <div className="p-2 border-b border-[var(--foreground)]/[0.15]">
            <input ref={catInputRef} type="text" value={catSearch} onChange={e => setCatSearch(e.target.value)}
              placeholder={isAr ? 'ابحث أو اكتب فئة جديدة...' : 'Search or type new...'}
              className="w-full bg-[var(--foreground)]/[0.05] rounded-lg px-3 py-2 text-[12px] outline-none focus:ring-1 focus:ring-[var(--color-primary)]/30 placeholder:text-[var(--foreground)]"
              onKeyDown={e => {
                if (e.key === 'Enter' && catSearch.trim()) {
                  const match = allCategories.find(c => c === catSearch.trim() || (CATEGORY_LABELS[c]?.en ?? c).toLowerCase() === catSearch.trim().toLowerCase());
                  onChange(match || catSearch.trim());
                  if (!match && isNewCategory) {
                    store.addCustomCategory(catSearch.trim());
                  }
                  setCatOpen(false);
                  setCatSearch('');
                }
              }}
            />
          </div>
          <div className="p-2 grid grid-cols-2 gap-1 max-h-[240px] overflow-y-auto">
            {filtered.map(c => {
              const label = isAr ? (CATEGORY_LABELS[c]?.ar ?? c) : (CATEGORY_LABELS[c]?.en ?? c);
              const isActive = value === c;
              return (
                <button key={c} type="button"
                  onClick={() => { onChange(c); setCatOpen(false); setCatSearch(''); }}
                  className={cn('flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-[12px] font-bold transition-all duration-150 border',
                    isActive
                      ? 'text-white shadow-md border-transparent'
                      : 'text-[var(--foreground)] border-transparent hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/[0.06] hover:border-[var(--color-primary)]/20')}
                  style={isActive ? { background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.8))' } : undefined}>
                  {label}
                  {isActive && <CheckCircle2 className="h-3.5 w-3.5" />}
                </button>
              );
            })}
          </div>
          {isNewCategory && (
            <div className="p-2 border-t border-[var(--foreground)]/[0.15]">
              <button type="button"
                onClick={() => {
                  store.addCustomCategory(catSearch.trim());
                  onChange(catSearch.trim());
                  setCatOpen(false);
                  setCatSearch('');
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-bold text-white transition-all duration-150"
                style={{ background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.8))' }}>
                <Plus className="h-3.5 w-3.5" />
                {isAr ? `إنشاء "${catSearch.trim()}"` : `Create "${catSearch.trim()}"`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CategoryPicker;
