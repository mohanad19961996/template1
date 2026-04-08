'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

function SortableItem({ id, disabled, children }: { id: string; disabled?: boolean; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });

  if (disabled) return <>{children}</>;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : 1,
    position: 'relative' as const,
  };

  return (
    <div ref={setNodeRef} style={style} className={cn('h-full', isDragging && 'shadow-xl ring-2 ring-[var(--color-primary)]/30 rounded-2xl')}>
      {/* Floating drag handle */}
      <button type="button" {...attributes} {...listeners}
        className="group/grip absolute top-2 start-2 z-10 touch-none cursor-grab active:cursor-grabbing h-7 w-7 rounded-lg flex items-center justify-center bg-[var(--color-background)]/90 border border-[var(--foreground)]/[0.1] shadow-sm text-[var(--foreground)]/70 backdrop-blur-sm transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] motion-safe:hover:scale-110 motion-safe:hover:border-[var(--color-primary)]/28 motion-safe:hover:text-[var(--color-primary)] motion-safe:hover:shadow-md motion-safe:active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/35">
        <GripVertical className="h-3.5 w-3.5 transition-transform duration-200 motion-safe:group-hover/grip:scale-110" />
      </button>
      {children}
    </div>
  );
}

export default SortableItem;
