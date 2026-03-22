"use client";

import { useState, useCallback } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useSiteConfig } from "@/providers/site-config-provider";
import { Container } from "@/components/shared/container";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Type,
  Globe,
  Settings2,
} from "lucide-react";
import type { SectionConfig } from "@/lib/site-config";

/* ═══════════════════════════════════════════════════════════════
   PAGE EDITOR — Reusable dashboard component for editing
   any page's section titles, subtitles, and visibility.
   ═══════════════════════════════════════════════════════════════ */

interface PageEditorProps {
  pageKey: string;
  pageTitleEn: string;
  pageTitleAr: string;
  pageIcon: React.ReactNode;
}

/* ── Shared sub-components ── */

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  dir,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  dir?: string;
}) {
  return (
    <div className="space-y-1">
      <label
        className="text-[10px] font-semibold uppercase tracking-wider"
        style={{ opacity: 0.4 }}
      >
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir={dir}
        className="w-full h-9 px-3 rounded-lg text-[12px] font-medium outline-none"
        style={{
          border: "1.5px solid rgba(var(--color-primary-rgb) / 0.1)",
          background: "rgba(var(--color-primary-rgb) / 0.02)",
          transition: "border-color 0.2s ease",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--color-primary)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor =
            "rgba(var(--color-primary-rgb) / 0.1)";
        }}
      />
    </div>
  );
}

function VisibilityToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className="flex items-center gap-2 py-1.5 px-3 rounded-xl cursor-pointer"
      style={{
        border: checked
          ? "1.5px solid rgba(var(--color-primary-rgb) / 0.25)"
          : "1.5px solid rgba(var(--color-primary-rgb) / 0.1)",
        background: checked
          ? "rgba(var(--color-primary-rgb) / 0.06)"
          : "transparent",
        transition: "all 0.3s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor =
          "rgba(var(--color-primary-rgb) / 0.35)";
        e.currentTarget.style.background =
          "rgba(var(--color-primary-rgb) / 0.04)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = checked
          ? "rgba(var(--color-primary-rgb) / 0.25)"
          : "rgba(var(--color-primary-rgb) / 0.1)";
        e.currentTarget.style.background = checked
          ? "rgba(var(--color-primary-rgb) / 0.06)"
          : "transparent";
      }}
    >
      {checked ? (
        <Eye
          className="h-3.5 w-3.5"
          style={{ color: "var(--color-primary)" }}
        />
      ) : (
        <EyeOff className="h-3.5 w-3.5" style={{ opacity: 0.3 }} />
      )}
      <span
        className="text-[11px] font-medium"
        style={{
          color: checked ? "var(--color-primary)" : "inherit",
          opacity: checked ? 1 : 0.5,
        }}
      >
        {label}
      </span>
    </button>
  );
}

/* ── Section Card ── */

function SectionEditorCard({
  sectionKey,
  section,
  onUpdate,
  isAr,
}: {
  sectionKey: string;
  section: SectionConfig;
  onUpdate: (updates: Partial<SectionConfig>) => void;
  isAr: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const displayName = sectionKey
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();

  return (
    <motion.div
      layout
      className="rounded-2xl overflow-hidden"
      style={{
        border: expanded
          ? "2px solid rgba(var(--color-primary-rgb) / 0.2)"
          : "2px solid rgba(var(--color-primary-rgb) / 0.08)",
        background: "var(--color-card)",
        transition: "border-color 0.3s ease",
      }}
    >
      {/* Header — clickable to expand */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 cursor-pointer"
        style={{ transition: "background 0.2s ease" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background =
            "rgba(var(--color-primary-rgb) / 0.02)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center"
            style={{
              background: section.visible
                ? "rgba(var(--color-primary-rgb) / 0.1)"
                : "rgba(var(--color-primary-rgb) / 0.04)",
            }}
          >
            <Settings2
              className="h-4 w-4"
              style={{
                color: section.visible ? "var(--color-primary)" : "inherit",
                opacity: section.visible ? 1 : 0.3,
              }}
            />
          </div>
          <div className="text-start">
            <div
              className="text-[13px] font-semibold"
              style={{ opacity: section.visible ? 1 : 0.5 }}
            >
              {displayName}
            </div>
            <div className="text-[10px]" style={{ opacity: 0.35 }}>
              {sectionKey}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <VisibilityToggle
            checked={section.visible}
            onChange={(v) => onUpdate({ visible: v })}
            label={isAr ? "مرئي" : "Visible"}
          />
          {expanded ? (
            <ChevronUp
              className="h-4 w-4"
              style={{ opacity: 0.4, transition: "transform 0.2s ease" }}
            />
          ) : (
            <ChevronDown
              className="h-4 w-4"
              style={{ opacity: 0.4, transition: "transform 0.2s ease" }}
            />
          )}
        </div>
      </button>

      {/* Expandable content */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div
              className="px-4 pb-5 pt-1 space-y-4"
              style={{
                borderTop: "1px solid rgba(var(--color-primary-rgb) / 0.06)",
              }}
            >
              {/* Title fields */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Type
                    className="h-3.5 w-3.5"
                    style={{ color: "var(--color-primary)" }}
                  />
                  <span
                    className="text-[11px] font-semibold tracking-wider uppercase"
                    style={{ opacity: 0.5 }}
                  >
                    {isAr ? "العنوان" : "Title"}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <TextInput
                    label={isAr ? "الإنجليزية" : "English"}
                    value={section.titleEn}
                    onChange={(v) => onUpdate({ titleEn: v })}
                    placeholder="Section title (EN)"
                  />
                  <TextInput
                    label={isAr ? "العربية" : "Arabic"}
                    value={section.titleAr}
                    onChange={(v) => onUpdate({ titleAr: v })}
                    placeholder="عنوان القسم"
                    dir="rtl"
                  />
                </div>
              </div>

              {/* Subtitle fields */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Globe
                    className="h-3.5 w-3.5"
                    style={{ color: "var(--color-primary)" }}
                  />
                  <span
                    className="text-[11px] font-semibold tracking-wider uppercase"
                    style={{ opacity: 0.5 }}
                  >
                    {isAr ? "العنوان الفرعي" : "Subtitle"}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <TextInput
                    label={isAr ? "الإنجليزية" : "English"}
                    value={section.subtitleEn}
                    onChange={(v) => onUpdate({ subtitleEn: v })}
                    placeholder="Section subtitle (EN)"
                  />
                  <TextInput
                    label={isAr ? "العربية" : "Arabic"}
                    value={section.subtitleAr}
                    onChange={(v) => onUpdate({ subtitleAr: v })}
                    placeholder="العنوان الفرعي"
                    dir="rtl"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export function PageEditor({
  pageKey,
  pageTitleEn,
  pageTitleAr,
  pageIcon,
}: PageEditorProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const { config, updateConfig } = useSiteConfig();

  const pageContent = config.pagesContent?.[pageKey] ?? { sections: {} };
  const sections = pageContent.sections ?? {};

  const BackArrow = isAr ? ArrowRight : ArrowLeft;
  const pageTitle = isAr ? pageTitleAr : pageTitleEn;

  /* ── Section updater ── */
  const updateSection = useCallback(
    (sectionKey: string, updates: Partial<SectionConfig>) => {
      const current = config.pagesContent ?? {};
      const currentPage = current[pageKey] ?? { sections: {} };
      updateConfig({
        pagesContent: {
          ...current,
          [pageKey]: {
            sections: {
              ...currentPage.sections,
              [sectionKey]: {
                ...currentPage.sections[sectionKey],
                ...updates,
              },
            },
          },
        },
      });
    },
    [config.pagesContent, pageKey, updateConfig]
  );

  /* ── Reset page ── */
  const resetPage = useCallback(() => {
    const current = config.pagesContent ?? {};
    const { [pageKey]: _, ...rest } = current;
    updateConfig({ pagesContent: rest });
  }, [config.pagesContent, pageKey, updateConfig]);

  const sectionEntries = Object.entries(sections);

  return (
    <div className="min-h-screen pb-20" style={{ color: "var(--color-foreground)" }}>
      <Container size="sm">
        {/* ── Header ── */}
        <div className="pt-8 pb-6">
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 py-2 px-3 rounded-xl text-[12px] font-medium cursor-pointer"
              style={{
                border: "1.5px solid rgba(var(--color-primary-rgb) / 0.1)",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor =
                  "rgba(var(--color-primary-rgb) / 0.3)";
                e.currentTarget.style.background =
                  "rgba(var(--color-primary-rgb) / 0.04)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor =
                  "rgba(var(--color-primary-rgb) / 0.1)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <BackArrow className="h-3.5 w-3.5" />
              {isAr ? "لوحة التحكم" : "Dashboard"}
            </Link>

            <button
              onClick={resetPage}
              className="flex items-center gap-2 py-2 px-3 rounded-xl text-[12px] font-medium cursor-pointer"
              style={{
                border: "1.5px solid rgba(239, 68, 68, 0.2)",
                color: "rgb(239, 68, 68)",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.4)";
                e.currentTarget.style.background = "rgba(239, 68, 68, 0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.2)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {isAr ? "إعادة تعيين" : "Reset Page"}
            </button>
          </div>

          {/* Title */}
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(var(--color-primary-rgb) / 0.1)" }}
            >
              {pageIcon}
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{pageTitle}</h1>
              <p className="text-[12px] mt-0.5" style={{ opacity: 0.4 }}>
                {isAr
                  ? "تعديل أقسام ومحتوى الصفحة"
                  : "Edit page sections and content"}
              </p>
            </div>
          </div>
        </div>

        {/* ── Section Cards ── */}
        {sectionEntries.length === 0 ? (
          <div
            className="rounded-2xl p-10 text-center"
            style={{
              border: "2px dashed rgba(var(--color-primary-rgb) / 0.12)",
              background: "rgba(var(--color-primary-rgb) / 0.02)",
            }}
          >
            <Settings2
              className="h-8 w-8 mx-auto mb-3"
              style={{ opacity: 0.2 }}
            />
            <p
              className="text-[13px] font-medium"
              style={{ opacity: 0.4 }}
            >
              {isAr
                ? "لا توجد أقسام مُهيأة لهذه الصفحة بعد."
                : "No sections configured for this page yet."}
            </p>
            <p
              className="text-[11px] mt-1"
              style={{ opacity: 0.25 }}
            >
              {isAr
                ? "ستظهر الأقسام هنا عند توفرها."
                : "Sections will appear here once available."}
            </p>
          </div>
        ) : (
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          >
            {sectionEntries.map(([key, section], index) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.05,
                  ease: [0.4, 0, 0.2, 1],
                }}
              >
                <SectionEditorCard
                  sectionKey={key}
                  section={section}
                  onUpdate={(updates) => updateSection(key, updates)}
                  isAr={isAr}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ── Footer hint ── */}
        {sectionEntries.length > 0 && (
          <div className="mt-6 text-center">
            <p className="text-[11px]" style={{ opacity: 0.3 }}>
              {isAr
                ? "التغييرات تُحفظ تلقائيًا"
                : "Changes are saved automatically"}
            </p>
          </div>
        )}
      </Container>
    </div>
  );
}
