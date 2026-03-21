"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useSiteConfig } from "@/providers/site-config-provider";
import {
  ArrowLeft,
  ArrowRight,
  ToggleLeft,
  ToggleRight,
  BarChart3,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   SHARED UI COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

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

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5 space-y-4" style={{ border: "2px solid rgba(var(--color-primary-rgb) / 0.1)", background: "var(--color-card)" }}>
      <h3 className="text-[13px] font-bold tracking-tight pb-3" style={{ borderBottom: "1px solid rgba(var(--color-primary-rgb) / 0.08)" }}>{title}</h3>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STATS DASHBOARD
   ═══════════════════════════════════════════════════════════════ */

const SAMPLE_STATS = [
  { number: "2.5K+", label: "Users" },
  { number: "99.9%", label: "Uptime" },
  { number: "150+", label: "Projects" },
  { number: "24/7", label: "Support" },
];

export function StatsDashboard() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const { config, updateStats } = useSiteConfig();
  const stats = config.stats;

  const BackIcon = isAr ? ArrowRight : ArrowLeft;

  return (
    <div className="space-y-6">
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full"
            style={{
              border: "1.5px solid rgba(var(--color-primary-rgb) / 0.2)",
              color: "var(--color-primary)",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--color-primary)";
              e.currentTarget.style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--color-primary)";
            }}
          >
            <BackIcon className="h-3.5 w-3.5" />
            {isAr ? "لوحة التحكم" : "Dashboard"}
          </Link>
          <h1 className="text-lg font-bold tracking-tight">{isAr ? "الإحصائيات" : "Stats"}</h1>
        </div>
      </div>

      {/* ── Live Preview ── */}
      <div
        className="rounded-2xl p-6 overflow-hidden"
        style={{
          border: "2px solid rgba(var(--color-primary-rgb) / 0.1)",
          background: "var(--color-card)",
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
          <span className="text-[12px] font-semibold" style={{ color: "var(--color-primary)" }}>
            {isAr ? "معاينة مباشرة" : "Live Preview"}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {SAMPLE_STATS.map((stat, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-1.5 py-4 px-2 rounded-xl text-center"
              style={{
                background: "rgba(var(--color-primary-rgb) / 0.04)",
                border: "1px solid rgba(var(--color-primary-rgb) / 0.08)",
              }}
            >
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center mb-1"
                style={{ background: "rgba(var(--color-primary-rgb) / 0.1)" }}
              >
                <BarChart3 className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
              </div>
              <span className="text-lg font-bold" style={{ color: "var(--color-primary)" }}>
                {stat.number}
              </span>
              <span className="text-[11px] font-medium" style={{ opacity: 0.6 }}>
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {stats.autoPlay && (
          <div className="mt-3 flex items-center justify-center gap-1.5">
            <span className="text-[10px] font-medium" style={{ opacity: 0.4 }}>
              {isAr ? "تشغيل تلقائي" : "Auto-playing"} — {(stats.interval / 1000).toFixed(1)}s
            </span>
          </div>
        )}
      </div>

      {/* ── Controls ── */}
      <div className="grid gap-4">
        <SectionCard title={isAr ? "سلوك التشغيل" : "Playback Behavior"}>
          <div className="space-y-4">
            <Toggle
              checked={stats.autoPlay}
              onChange={(v) => updateStats({ autoPlay: v })}
              label={isAr ? "تشغيل تلقائي" : "Auto Play"}
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium">
                  {isAr ? "الفاصل الزمني" : "Interval"}
                </span>
                <span
                  className="text-[12px] font-bold px-2 py-0.5 rounded-md"
                  style={{
                    background: "rgba(var(--color-primary-rgb) / 0.08)",
                    color: "var(--color-primary)",
                  }}
                >
                  {(stats.interval / 1000).toFixed(1)}s
                </span>
              </div>
              <input
                type="range"
                min={2000}
                max={8000}
                step={500}
                value={stats.interval}
                onChange={(e) => updateStats({ interval: Number(e.target.value) })}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{
                  accentColor: "var(--color-primary)",
                  background: `linear-gradient(to ${isAr ? "left" : "right"}, var(--color-primary) ${((stats.interval - 2000) / 6000) * 100}%, rgba(var(--color-primary-rgb) / 0.15) ${((stats.interval - 2000) / 6000) * 100}%)`,
                }}
              />
              <div className="flex justify-between">
                <span className="text-[10px]" style={{ opacity: 0.4 }}>2.0s</span>
                <span className="text-[10px]" style={{ opacity: 0.4 }}>8.0s</span>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
