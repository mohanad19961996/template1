"use client";

import { useLocale } from "next-intl";
import { useSiteConfig } from "@/providers/site-config-provider";
import {
  ToggleLeft,
  ToggleRight,
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

export function StatsDashboard() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const { config, updateStats } = useSiteConfig();
  const stats = config.stats;

  return (
    <div className="space-y-6">
      {/* ── Controls ── */}
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
  );
}
