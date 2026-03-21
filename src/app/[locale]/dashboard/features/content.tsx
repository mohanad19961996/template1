"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useSiteConfig } from "@/providers/site-config-provider";
import { ArrowLeft, ArrowRight, ToggleLeft, ToggleRight, Layers } from "lucide-react";

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

/* ── Feature card preview ── */
function FeatureCardPreview({ index, showRatings, showBadges, showQuotes, showImages }: { index: number; showRatings: boolean; showBadges: boolean; showQuotes: boolean; showImages: boolean }) {
  const hues = [210, 150, 30];
  const hue = hues[index % hues.length];

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-2.5"
      style={{
        border: "2px solid rgba(var(--color-primary-rgb) / 0.1)",
        background: "var(--color-card)",
      }}
    >
      {/* Icon placeholder */}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ background: `hsl(${hue} 60% 92%)` }}
      >
        <Layers size={18} style={{ color: `hsl(${hue} 60% 45%)` }} />
      </div>

      {/* Badge */}
      {showBadges && (
        <span
          className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full self-start"
          style={{ background: "rgba(var(--color-primary-rgb) / 0.1)", color: "var(--color-primary)" }}
        >
          Feature {index + 1}
        </span>
      )}

      {/* Title */}
      <div
        className="h-3 rounded-full w-3/4"
        style={{ background: "rgba(var(--color-primary-rgb) / 0.18)" }}
      />

      {/* Description lines */}
      <div className="flex flex-col gap-1.5">
        <div className="h-2 rounded-full w-full" style={{ background: "rgba(var(--color-primary-rgb) / 0.08)" }} />
        <div className="h-2 rounded-full w-5/6" style={{ background: "rgba(var(--color-primary-rgb) / 0.08)" }} />
      </div>

      {/* Image placeholder */}
      {showImages && (
        <div
          className="w-full h-16 rounded-lg mt-1"
          style={{ background: "rgba(var(--color-primary-rgb) / 0.06)", border: "1px dashed rgba(var(--color-primary-rgb) / 0.15)" }}
        />
      )}

      {/* Ratings */}
      {showRatings && (
        <div className="flex gap-0.5 mt-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <span key={star} className="text-[12px]" style={{ color: "var(--color-primary)", opacity: star <= 4 ? 1 : 0.3 }}>&#9733;</span>
          ))}
        </div>
      )}

      {/* Quote */}
      {showQuotes && (
        <div
          className="text-[10px] italic px-2 py-1.5 rounded-md mt-1"
          style={{ background: "rgba(var(--color-primary-rgb) / 0.04)", borderLeft: "2px solid rgba(var(--color-primary-rgb) / 0.2)", opacity: 0.6 }}
        >
          &ldquo;Amazing feature...&rdquo;
        </div>
      )}
    </div>
  );
}

/* ── Main dashboard ── */
export function FeaturesDashboard() {
  const locale = useLocale();
  const isRTL = locale === "ar";
  const { config, updateFeatures } = useSiteConfig();
  const f = config.features;

  const [backHover, setBackHover] = useState(false);

  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen" style={{ background: "rgba(var(--color-primary-rgb) / 0.02)" }}>
      {/* ── Top bar ── */}
      <div
        className="sticky top-0 z-30 backdrop-blur-md"
        style={{ background: "rgba(var(--color-card), 0.8)", borderBottom: "1px solid rgba(var(--color-primary-rgb) / 0.08)" }}
      >
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-[12px] font-semibold px-4 py-1.5 rounded-lg cursor-pointer"
            style={{
              color: backHover ? "#fff" : "var(--color-primary)",
              background: backHover ? "var(--color-primary)" : "transparent",
              border: "1px solid rgba(var(--color-primary-rgb) / 0.15)",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={() => setBackHover(true)}
            onMouseLeave={() => setBackHover(false)}
          >
            <BackArrow size={14} />
            <span>{isRTL ? "العودة" : "Back"}</span>
          </Link>

          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(var(--color-primary-rgb) / 0.1)" }}
            >
              <Layers size={16} style={{ color: "var(--color-primary)" }} />
            </div>
            <h1 className="text-[18px] font-bold" style={{ color: "var(--color-primary)" }}>
              Features
            </h1>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-8">

        {/* ── Live Preview ── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: "2px solid rgba(var(--color-primary-rgb) / 0.1)", background: "var(--color-card)" }}
        >
          <div className="px-5 py-3.5" style={{ borderBottom: "1px solid rgba(var(--color-primary-rgb) / 0.08)" }}>
            <h2 className="text-[13px] font-bold uppercase tracking-wider" style={{ color: "var(--color-primary)" }}>
              Live Preview
            </h2>
          </div>

          <div className="p-6">
            {/* Section heading preview */}
            <div className="text-center mb-6">
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--color-primary)", opacity: 0.6 }}>
                {isRTL ? (f.subtitleAr || "العنوان الفرعي") : (f.subtitleEn || "Subtitle")}
              </p>
              <h3 className="text-[16px] font-bold" style={{ color: "var(--color-primary)" }}>
                {isRTL ? (f.titleAr || "العنوان") : (f.titleEn || "Title")}
              </h3>
            </div>

            {/* Feature cards grid */}
            <div className="grid grid-cols-3 gap-4">
              {[0, 1, 2].map((i) => (
                <FeatureCardPreview
                  key={i}
                  index={i}
                  showRatings={f.showRatings}
                  showBadges={f.showBadges}
                  showQuotes={f.showQuotes}
                  showImages={f.showImages}
                />
              ))}
            </div>
          </div>
        </div>

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
    </div>
  );
}
