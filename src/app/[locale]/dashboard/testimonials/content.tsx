"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useSiteConfig } from "@/providers/site-config-provider";
import { ArrowLeft, ArrowRight, ToggleLeft, ToggleRight, MessageCircle } from "lucide-react";

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
            <span>{isRTL ? "\u0627\u0644\u0639\u0648\u062F\u0629" : "Back"}</span>
          </Link>

          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(var(--color-primary-rgb) / 0.1)" }}
            >
              <MessageCircle size={16} style={{ color: "var(--color-primary)" }} />
            </div>
            <h1 className="text-[18px] font-bold" style={{ color: "var(--color-primary)" }}>
              Testimonials
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
                {isRTL ? (t.subtitleAr || "\u0627\u0644\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0641\u0631\u0639\u064A") : (t.subtitleEn || "Subtitle")}
              </p>
              <h3 className="text-[16px] font-bold" style={{ color: "var(--color-primary)" }}>
                {isRTL ? (t.titleAr || "\u0627\u0644\u0639\u0646\u0648\u0627\u0646") : (t.titleEn || "Title")}
              </h3>
            </div>

            {/* Testimonial card preview */}
            <div className="flex items-center justify-center gap-4">
              {/* Left side preview */}
              {t.showSidePreviews && (
                <div
                  className="w-48 rounded-xl p-4 flex-shrink-0 hidden sm:block"
                  style={{
                    border: "1.5px solid rgba(var(--color-primary-rgb) / 0.08)",
                    background: "rgba(var(--color-primary-rgb) / 0.02)",
                    opacity: 0.5,
                    transform: "scale(0.9)",
                  }}
                >
                  <MessageCircle size={14} style={{ color: "var(--color-primary)", opacity: 0.4 }} />
                  <div className="flex gap-0.5 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className="text-[10px]" style={{ color: "var(--color-primary)", opacity: star <= 4 ? 0.6 : 0.2 }}>&#9733;</span>
                    ))}
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="h-1.5 rounded-full w-full" style={{ background: "rgba(var(--color-primary-rgb) / 0.1)" }} />
                    <div className="h-1.5 rounded-full w-3/4" style={{ background: "rgba(var(--color-primary-rgb) / 0.1)" }} />
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="w-5 h-5 rounded-full" style={{ background: "rgba(var(--color-primary-rgb) / 0.12)" }} />
                    <div className="h-1.5 rounded-full w-12" style={{ background: "rgba(var(--color-primary-rgb) / 0.1)" }} />
                  </div>
                </div>
              )}

              {/* Main testimonial card */}
              <div
                className="max-w-sm w-full rounded-xl p-5"
                style={{
                  border: "2px solid rgba(var(--color-primary-rgb) / 0.12)",
                  background: "var(--color-card)",
                }}
              >
                <MessageCircle size={18} style={{ color: "var(--color-primary)", opacity: 0.3 }} />
                <div className="flex gap-0.5 mt-2.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className="text-[12px]" style={{ color: "var(--color-primary)", opacity: star <= 5 ? 1 : 0.3 }}>&#9733;</span>
                  ))}
                </div>
                <div className="mt-3 space-y-1.5">
                  <div className="h-2 rounded-full w-full" style={{ background: "rgba(var(--color-primary-rgb) / 0.1)" }} />
                  <div className="h-2 rounded-full w-5/6" style={{ background: "rgba(var(--color-primary-rgb) / 0.1)" }} />
                  <div className="h-2 rounded-full w-2/3" style={{ background: "rgba(var(--color-primary-rgb) / 0.1)" }} />
                </div>
                {t.showReadMore && (
                  <span
                    className="inline-block mt-2.5 text-[10px] font-semibold"
                    style={{ color: "var(--color-primary)", opacity: 0.6 }}
                  >
                    Read more...
                  </span>
                )}
                <div className="flex items-center gap-2.5 mt-4">
                  <div
                    className="w-8 h-8 rounded-full"
                    style={{ background: "rgba(var(--color-primary-rgb) / 0.12)" }}
                  />
                  <div className="space-y-1">
                    <div className="h-2 rounded-full w-20" style={{ background: "rgba(var(--color-primary-rgb) / 0.15)" }} />
                    <div className="h-1.5 rounded-full w-14" style={{ background: "rgba(var(--color-primary-rgb) / 0.08)" }} />
                  </div>
                </div>
              </div>

              {/* Right side preview */}
              {t.showSidePreviews && (
                <div
                  className="w-48 rounded-xl p-4 flex-shrink-0 hidden sm:block"
                  style={{
                    border: "1.5px solid rgba(var(--color-primary-rgb) / 0.08)",
                    background: "rgba(var(--color-primary-rgb) / 0.02)",
                    opacity: 0.5,
                    transform: "scale(0.9)",
                  }}
                >
                  <MessageCircle size={14} style={{ color: "var(--color-primary)", opacity: 0.4 }} />
                  <div className="flex gap-0.5 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className="text-[10px]" style={{ color: "var(--color-primary)", opacity: star <= 3 ? 0.6 : 0.2 }}>&#9733;</span>
                    ))}
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="h-1.5 rounded-full w-full" style={{ background: "rgba(var(--color-primary-rgb) / 0.1)" }} />
                    <div className="h-1.5 rounded-full w-2/3" style={{ background: "rgba(var(--color-primary-rgb) / 0.1)" }} />
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="w-5 h-5 rounded-full" style={{ background: "rgba(var(--color-primary-rgb) / 0.12)" }} />
                    <div className="h-1.5 rounded-full w-10" style={{ background: "rgba(var(--color-primary-rgb) / 0.1)" }} />
                  </div>
                </div>
              )}
            </div>

            {/* Auto-play indicator */}
            {t.autoPlay && (
              <div className="flex items-center justify-center gap-1.5 mt-4">
                {[0, 1, 2].map((dot) => (
                  <div
                    key={dot}
                    className="rounded-full"
                    style={{
                      width: dot === 0 ? 16 : 6,
                      height: 6,
                      background: "var(--color-primary)",
                      opacity: dot === 0 ? 0.8 : 0.2,
                      borderRadius: 999,
                      transition: "all 0.3s ease",
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

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
    </div>
  );
}
