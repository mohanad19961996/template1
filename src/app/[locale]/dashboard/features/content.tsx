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

/* ── Toggle row helper ── */
function ToggleRow({ label, value, onToggle }: { label: string; value: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center justify-between w-full py-2.5 cursor-pointer"
    >
      <span className="text-[13px] font-medium">{label}</span>
      {value ? (
        <ToggleRight size={24} style={{ color: "var(--color-primary)" }} />
      ) : (
        <ToggleLeft size={24} style={{ opacity: 0.3 }} />
      )}
    </button>
  );
}

/* ── Main dashboard ── */
export function FeaturesDashboard() {
  const locale = useLocale();
  const isRTL = locale === "ar";
  const { config, updateFeatures } = useSiteConfig();
  const f = config.features;

  return (
    <div className="space-y-6">
        {/* ── Section Heading Content ── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: "2px solid rgba(var(--color-primary-rgb) / 0.1)", background: "var(--color-card)" }}
        >
          <div className="px-5 py-3.5" style={{ borderBottom: "1px solid rgba(var(--color-primary-rgb) / 0.08)" }}>
            <h2 className="text-[13px] font-bold uppercase tracking-wider" style={{ color: "var(--color-primary)" }}>
              Section Heading
            </h2>
          </div>

          <div className="p-5 grid grid-cols-2 gap-4">
            <TextInput
              label="Title (English)"
              value={f.titleEn}
              onChange={(v) => updateFeatures({ titleEn: v })}
            />
            <TextInput
              label="Title (Arabic)"
              value={f.titleAr}
              onChange={(v) => updateFeatures({ titleAr: v })}
              dir="rtl"
            />
            <TextInput
              label="Subtitle (English)"
              value={f.subtitleEn}
              onChange={(v) => updateFeatures({ subtitleEn: v })}
            />
            <TextInput
              label="Subtitle (Arabic)"
              value={f.subtitleAr}
              onChange={(v) => updateFeatures({ subtitleAr: v })}
              dir="rtl"
            />
          </div>
        </div>

        {/* ── Toggles ── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: "2px solid rgba(var(--color-primary-rgb) / 0.1)", background: "var(--color-card)" }}
        >
          <div className="px-5 py-3.5" style={{ borderBottom: "1px solid rgba(var(--color-primary-rgb) / 0.08)" }}>
            <h2 className="text-[13px] font-bold uppercase tracking-wider" style={{ color: "var(--color-primary)" }}>
              Display Options
            </h2>
          </div>

          <div className="px-5 divide-y" style={{ borderColor: "rgba(var(--color-primary-rgb) / 0.06)" }}>
            <ToggleRow
              label="Show Ratings"
              value={f.showRatings}
              onToggle={() => updateFeatures({ showRatings: !f.showRatings })}
            />
            <ToggleRow
              label="Show Badges"
              value={f.showBadges}
              onToggle={() => updateFeatures({ showBadges: !f.showBadges })}
            />
            <ToggleRow
              label="Show Quotes"
              value={f.showQuotes}
              onToggle={() => updateFeatures({ showQuotes: !f.showQuotes })}
            />
            <ToggleRow
              label="Show Modal"
              value={f.showModal}
              onToggle={() => updateFeatures({ showModal: !f.showModal })}
            />
            <ToggleRow
              label="Show Images"
              value={f.showImages}
              onToggle={() => updateFeatures({ showImages: !f.showImages })}
            />
          </div>
        </div>
    </div>
  );
}
