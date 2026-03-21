"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useSiteConfig } from "@/providers/site-config-provider";
import {
  ArrowLeft,
  ArrowRight,
  ToggleLeft,
  ToggleRight,
  Briefcase,
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

/* ─── Service Card Preview ─────────────────────────────────────────── */

function ServiceCardPreview({
  showCategories,
  showFeatureList,
  showImages,
}: {
  showCategories: boolean;
  showFeatureList: boolean;
  showImages: boolean;
}) {
  return (
    <div
      className="rounded-xl p-3 space-y-2"
      style={{
        border: "1.5px solid rgba(var(--color-primary-rgb) / 0.1)",
        background: "rgba(var(--color-primary-rgb) / 0.02)",
      }}
    >
      {/* Image placeholder */}
      {showImages && (
        <div
          className="w-full h-10 rounded-lg"
          style={{ background: "rgba(var(--color-primary-rgb) / 0.08)" }}
        />
      )}

      {/* Icon placeholder */}
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center"
        style={{ background: "rgba(var(--color-primary-rgb) / 0.1)" }}
      >
        <Briefcase
          className="w-3.5 h-3.5"
          style={{ color: "var(--color-primary)" }}
        />
      </div>

      {/* Category badge */}
      {showCategories && (
        <div
          className="w-12 h-3 rounded-full"
          style={{ background: "rgba(var(--color-primary-rgb) / 0.12)" }}
        />
      )}

      {/* Title line */}
      <div
        className="w-3/4 h-2.5 rounded-full"
        style={{ background: "rgba(var(--color-primary-rgb) / 0.15)" }}
      />

      {/* Description line */}
      <div
        className="w-full h-2 rounded-full"
        style={{ background: "rgba(var(--color-primary-rgb) / 0.08)" }}
      />

      {/* Feature tags */}
      {showFeatureList && (
        <div className="flex gap-1 pt-1">
          <div
            className="w-10 h-3 rounded-full"
            style={{ background: "rgba(var(--color-primary-rgb) / 0.1)" }}
          />
          <div
            className="w-8 h-3 rounded-full"
            style={{ background: "rgba(var(--color-primary-rgb) / 0.1)" }}
          />
        </div>
      )}
    </div>
  );
}

/* ─── Main Dashboard Export ─────────────────────────────────────────── */

export function ServicesDashboard() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const { config, updateServices } = useSiteConfig();
  const services = config.services;

  const BackArrow = isRtl ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      {/* ── Top Bar ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-semibold"
          style={{
            border: "1.5px solid rgba(var(--color-primary-rgb) / 0.2)",
            color: "var(--color-primary)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--color-primary)";
            e.currentTarget.style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--color-primary)";
          }}
        >
          <BackArrow className="w-3.5 h-3.5" />
          Dashboard
        </Link>
        <h1 className="text-xl font-bold tracking-tight">Services</h1>
      </div>

      {/* ── Layout: Preview + Controls ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Live Preview */}
        <div className="space-y-4">
          <h2
            className="text-[11px] font-bold uppercase tracking-widest"
            style={{ color: "var(--color-primary)", opacity: 0.6 }}
          >
            Live Preview
          </h2>
          <div
            className="rounded-2xl p-6 space-y-5"
            style={{
              border: "2px solid rgba(var(--color-primary-rgb) / 0.1)",
              background: "var(--color-card)",
            }}
          >
            {/* Section title preview */}
            <div className="text-center space-y-1.5">
              <div
                className="text-[14px] font-bold"
                style={{ color: "var(--color-primary)" }}
              >
                {isRtl ? services.titleAr || "الخدمات" : services.titleEn || "Services"}
              </div>
              <div className="text-[11px]" style={{ opacity: 0.5 }}>
                {isRtl
                  ? services.subtitleAr || "نص فرعي"
                  : services.subtitleEn || "Subtitle text"}
              </div>
            </div>

            {/* 2x3 Card Grid */}
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <ServiceCardPreview
                  key={i}
                  showCategories={services.showCategories}
                  showFeatureList={services.showFeatureList}
                  showImages={services.showImages}
                />
              ))}
            </div>

            {/* View All button preview */}
            {services.showViewAll && (
              <div className="flex justify-center pt-2">
                <div
                  className="px-6 py-2 rounded-full text-[11px] font-semibold"
                  style={{
                    border: "1.5px solid rgba(var(--color-primary-rgb) / 0.2)",
                    color: "var(--color-primary)",
                  }}
                >
                  View All
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-5">
          <h2
            className="text-[11px] font-bold uppercase tracking-widest"
            style={{ color: "var(--color-primary)", opacity: 0.6 }}
          >
            Controls
          </h2>

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
      </div>
    </div>
  );
}
