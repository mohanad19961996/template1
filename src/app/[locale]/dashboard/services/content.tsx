"use client";

import { useLocale } from "next-intl";
import { useSiteConfig } from "@/providers/site-config-provider";
import {
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

/* ─── Shared Inline Components ─────────────────────────────────────── */

function TextInput({
  value,
  onChange,
  label,
  dir,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  dir?: string;
}) {
  return (
    <div>
      <label
        className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5"
        style={{ opacity: 0.4 }}
      >
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        dir={dir}
        className="w-full h-9 px-3 rounded-lg text-[12px] font-medium outline-none"
        style={{
          border: "1.5px solid rgba(var(--color-primary-rgb) / 0.12)",
          background: "rgba(var(--color-primary-rgb) / 0.02)",
          transition: "border-color 0.2s ease",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--color-primary)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor =
            "rgba(var(--color-primary-rgb) / 0.12)";
        }}
      />
    </div>
  );
}

function Toggle({
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
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between w-full py-2.5 px-3 rounded-xl cursor-pointer"
      style={{
        border: "1.5px solid rgba(var(--color-primary-rgb) / 0.1)",
        transition: "all 0.3s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor =
          "rgba(var(--color-primary-rgb) / 0.25)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor =
          "rgba(var(--color-primary-rgb) / 0.1)";
      }}
    >
      <span className="text-[12px] font-medium">{label}</span>
      {checked ? (
        <ToggleRight
          className="h-5 w-5"
          style={{ color: "var(--color-primary)" }}
        />
      ) : (
        <ToggleLeft className="h-5 w-5" style={{ opacity: 0.3 }} />
      )}
    </button>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-5 space-y-4"
      style={{
        border: "2px solid rgba(var(--color-primary-rgb) / 0.1)",
        background: "var(--color-card)",
      }}
    >
      <h3
        className="text-[13px] font-bold tracking-tight pb-3"
        style={{
          borderBottom: "1px solid rgba(var(--color-primary-rgb) / 0.08)",
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

/* ─── Main Dashboard Export ─────────────────────────────────────────── */

export function ServicesDashboard() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const { config, updateServices } = useSiteConfig();
  const services = config.services;

  return (
    <div className="space-y-6">
      {/* Content */}
      <SectionCard title="Content">
        <div className="space-y-3">
          <TextInput
            label="Title (English)"
            value={services.titleEn}
            onChange={(v) => updateServices({ titleEn: v })}
          />
          <TextInput
            label="Title (Arabic)"
            value={services.titleAr}
            onChange={(v) => updateServices({ titleAr: v })}
            dir="rtl"
          />
          <TextInput
            label="Subtitle (English)"
            value={services.subtitleEn}
            onChange={(v) => updateServices({ subtitleEn: v })}
          />
          <TextInput
            label="Subtitle (Arabic)"
            value={services.subtitleAr}
            onChange={(v) => updateServices({ subtitleAr: v })}
            dir="rtl"
          />
        </div>
      </SectionCard>

      {/* Toggles */}
      <SectionCard title="Toggles">
        <div className="space-y-2">
          <Toggle
            label="Show Categories"
            checked={services.showCategories}
            onChange={(v) => updateServices({ showCategories: v })}
          />
          <Toggle
            label="Show Feature List"
            checked={services.showFeatureList}
            onChange={(v) => updateServices({ showFeatureList: v })}
          />
          <Toggle
            label="Show View All"
            checked={services.showViewAll}
            onChange={(v) => updateServices({ showViewAll: v })}
          />
          <Toggle
            label="Show Images"
            checked={services.showImages}
            onChange={(v) => updateServices({ showImages: v })}
          />
        </div>
      </SectionCard>
    </div>
  );
}
