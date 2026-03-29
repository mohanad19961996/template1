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

function TextInput({ value, onChange, label, dir }: { value: string; onChange: (v: string) => void; label: string; dir?: string }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ opacity: 0.4 }}>{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} dir={dir}
        className="w-full h-9 px-3 rounded-lg text-[12px] font-medium outline-none"
        style={{ border: "1.5px solid rgba(var(--color-primary-rgb) / 0.12)", background: "rgba(var(--color-primary-rgb) / 0.02)", transition: "border-color 0.2s ease" }}
        onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-primary)"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.12)"; }}
      />
    </div>
  );
}

function TextArea({ value, onChange, label, dir }: { value: string; onChange: (v: string) => void; label: string; dir?: string }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ opacity: 0.4 }}>{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} dir={dir} rows={3}
        className="w-full px-3 py-2 rounded-lg text-[12px] font-medium outline-none resize-none"
        style={{ border: "1.5px solid rgba(var(--color-primary-rgb) / 0.12)", background: "rgba(var(--color-primary-rgb) / 0.02)", transition: "border-color 0.2s ease" }}
        onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-primary)"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.12)"; }}
      />
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button onClick={() => onChange(!checked)} className="flex items-center justify-between w-full py-2.5 px-3 rounded-xl cursor-pointer"
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
   PROCESS DASHBOARD
   ═══════════════════════════════════════════════════════════════ */

export function ProcessDashboard() {
  const locale = useLocale();
  const isAr = locale === "ar";

  const { config, updateProcess } = useSiteConfig();
  const process = config.process;

  return (
    <div className="space-y-6">
      {/* ── Controls ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title={isAr ? "النصوص (إنجليزي)" : "Text (English)"}>
          <TextInput label="Title (EN)" value={process.titleEn} onChange={(v) => updateProcess({ titleEn: v })} />
          <TextInput label="Subtitle (EN)" value={process.subtitleEn} onChange={(v) => updateProcess({ subtitleEn: v })} />
          <TextInput label="Badge (EN)" value={process.badgeEn} onChange={(v) => updateProcess({ badgeEn: v })} />
        </SectionCard>

        <SectionCard title={isAr ? "النصوص (عربي)" : "Text (Arabic)"}>
          <TextInput label="Title (AR)" value={process.titleAr} onChange={(v) => updateProcess({ titleAr: v })} dir="rtl" />
          <TextInput label="Subtitle (AR)" value={process.subtitleAr} onChange={(v) => updateProcess({ subtitleAr: v })} dir="rtl" />
          <TextInput label="Badge (AR)" value={process.badgeAr} onChange={(v) => updateProcess({ badgeAr: v })} dir="rtl" />
        </SectionCard>

        <SectionCard title={isAr ? "خيارات العرض" : "Display Options"}>
          <Toggle label={isAr ? "إظهار التفاصيل" : "Show Details"} checked={process.showDetails} onChange={(v) => updateProcess({ showDetails: v })} />
          <Toggle label={isAr ? "إظهار الموصلات" : "Show Connectors"} checked={process.showConnectors} onChange={(v) => updateProcess({ showConnectors: v })} />
          <Toggle label={isAr ? "إظهار دعوة للعمل أسفل" : "Show Bottom CTA"} checked={process.showBottomCta} onChange={(v) => updateProcess({ showBottomCta: v })} />
        </SectionCard>
      </div>
    </div>
  );
}
