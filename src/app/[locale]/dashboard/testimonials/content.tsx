"use client";

import { useLocale } from "next-intl";
import { useSiteConfig } from "@/providers/site-config-provider";
import { ToggleLeft, ToggleRight } from "lucide-react";

/* ── TextInput helper ── */
function TextInput({ value, onChange, label, dir }: { value: string; onChange: (v: string) => void; label: string; dir?: string }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ opacity: 0.4 }}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        dir={dir}
        className="w-full h-9 px-3 rounded-lg text-[12px] font-medium outline-none"
        style={{ border: "1.5px solid rgba(var(--color-primary-rgb) / 0.12)", background: "rgba(var(--color-primary-rgb) / 0.02)", transition: "border-color 0.2s ease" }}
        onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-primary)"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.12)"; }}
      />
    </div>
  );
}

/* ── Toggle helper ── */
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between w-full py-2.5 px-3 rounded-xl cursor-pointer"
      style={{ border: "1.5px solid rgba(var(--color-primary-rgb) / 0.1)", transition: "all 0.3s ease" }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.25)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.1)"; }}
    >
      <span className="text-[12px] font-medium">{label}</span>
      {checked ? <ToggleRight className="h-5 w-5" style={{ color: "var(--color-primary)" }} /> : <ToggleLeft className="h-5 w-5" style={{ opacity: 0.3 }} />}
    </button>
  );
}

/* ── SectionCard helper ── */
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5 space-y-4" style={{ border: "2px solid rgba(var(--color-primary-rgb) / 0.1)", background: "var(--color-card)" }}>
      <h3 className="text-[13px] font-bold tracking-tight pb-3" style={{ borderBottom: "1px solid rgba(var(--color-primary-rgb) / 0.08)" }}>{title}</h3>
      {children}
    </div>
  );
}

/* ── Main dashboard ── */
export function TestimonialsDashboard() {
  const locale = useLocale();
  const isRTL = locale === "ar";
  const { config, updateTestimonials } = useSiteConfig();
  const t = config.testimonials;

  return (
    <div className="space-y-6">
        {/* ── Content Controls ── */}
        <SectionCard title="Content">
          <div className="grid grid-cols-2 gap-4">
            <TextInput
              label="Title (English)"
              value={t.titleEn}
              onChange={(v) => updateTestimonials({ titleEn: v })}
            />
            <TextInput
              label="Title (Arabic)"
              value={t.titleAr}
              onChange={(v) => updateTestimonials({ titleAr: v })}
              dir="rtl"
            />
            <TextInput
              label="Subtitle (English)"
              value={t.subtitleEn}
              onChange={(v) => updateTestimonials({ subtitleEn: v })}
            />
            <TextInput
              label="Subtitle (Arabic)"
              value={t.subtitleAr}
              onChange={(v) => updateTestimonials({ subtitleAr: v })}
              dir="rtl"
            />
          </div>
        </SectionCard>

        {/* ── Toggles ── */}
        <SectionCard title="Display Options">
          <div className="space-y-2.5">
            <Toggle
              label="Auto Play"
              checked={t.autoPlay}
              onChange={(v) => updateTestimonials({ autoPlay: v })}
            />
            <Toggle
              label="Show Read More"
              checked={t.showReadMore}
              onChange={(v) => updateTestimonials({ showReadMore: v })}
            />
            <Toggle
              label="Show Side Previews"
              checked={t.showSidePreviews}
              onChange={(v) => updateTestimonials({ showSidePreviews: v })}
            />
          </div>
        </SectionCard>
    </div>
  );
}
