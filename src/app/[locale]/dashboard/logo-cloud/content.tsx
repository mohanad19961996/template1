"use client";

import { useLocale } from "next-intl";
import { useSiteConfig } from "@/providers/site-config-provider";
import {
  ToggleLeft,
  ToggleRight,
  X,
  Plus,
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
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.25)"; e.currentTarget.style.background = "rgba(var(--color-primary-rgb) / 0.02)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.1)"; e.currentTarget.style.background = "transparent"; }}
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
        style={{
          border: "1.5px solid rgba(var(--color-primary-rgb) / 0.12)",
          background: "rgba(var(--color-primary-rgb) / 0.02)",
          transition: "border-color 0.2s ease",
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-primary)"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.12)"; }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN LOGO CLOUD DASHBOARD
   ═══════════════════════════════════════════════════════════════ */

export function LogoCloudDashboard() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const { config, updateLogoCloud } = useSiteConfig();
  const lc = config.logoCloud;

  const handleLogoChange = (index: number, value: string) => {
    const updated = [...lc.logos];
    updated[index] = value;
    updateLogoCloud({ logos: updated });
  };

  const handleRemoveLogo = (index: number) => {
    const updated = lc.logos.filter((_, i) => i !== index);
    updateLogoCloud({ logos: updated });
  };

  const handleAddLogo = () => {
    updateLogoCloud({ logos: [...lc.logos, "NEW"] });
  };

  return (
    <div className="space-y-6">
      {/* Toggle + Speed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SectionCard title={isAr ? "إعدادات العرض" : "Display Settings"}>
          <div className="space-y-3">
            <Toggle
              checked={lc.showHeading}
              onChange={(v) => updateLogoCloud({ showHeading: v })}
              label={isAr ? "إظهار العنوان" : "Show Heading"}
            />
          </div>
        </SectionCard>

        <SectionCard title={isAr ? "سرعة التمرير" : "Scroll Speed"}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-wider uppercase" style={{ opacity: 0.5 }}>
                {isAr ? "المدة" : "Duration"}
              </span>
              <span className="text-[12px] font-bold" style={{ color: "var(--color-primary)" }}>
                {lc.speed}s
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={60}
              step={1}
              value={lc.speed}
              onChange={(e) => updateLogoCloud({ speed: Number(e.target.value) })}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${((lc.speed - 10) / 50) * 100}%, rgba(var(--color-primary-rgb) / 0.12) ${((lc.speed - 10) / 50) * 100}%, rgba(var(--color-primary-rgb) / 0.12) 100%)`,
                accentColor: "var(--color-primary)",
              }}
            />
            <div className="flex justify-between">
              <span className="text-[9px] font-medium" style={{ opacity: 0.3 }}>{isAr ? "سريع" : "Fast"} (10s)</span>
              <span className="text-[9px] font-medium" style={{ opacity: 0.3 }}>{isAr ? "بطيء" : "Slow"} (60s)</span>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Heading Text */}
      <SectionCard title={isAr ? "نص العنوان" : "Heading Text"}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextInput
            label="English"
            value={lc.headingEn}
            onChange={(v) => updateLogoCloud({ headingEn: v })}
          />
          <TextInput
            label={isAr ? "العربية" : "Arabic"}
            value={lc.headingAr}
            onChange={(v) => updateLogoCloud({ headingAr: v })}
            dir="rtl"
          />
        </div>
      </SectionCard>

      {/* Logo List Editor */}
      <SectionCard title={isAr ? "قائمة الشعارات" : "Logo List"}>
        <div className="space-y-2">
          {lc.logos.map((logo, index) => (
            <div key={index} className="flex items-end gap-2">
              <div className="flex-1">
                <TextInput
                  label={`${isAr ? "شعار" : "Logo"} ${index + 1}`}
                  value={logo}
                  onChange={(v) => handleLogoChange(index, v)}
                />
              </div>
              <button
                onClick={() => handleRemoveLogo(index)}
                className="h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-lg cursor-pointer"
                style={{
                  border: "1.5px solid rgba(var(--color-primary-rgb) / 0.12)",
                  background: "rgba(var(--color-primary-rgb) / 0.02)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.background = "rgba(239,68,68,0.06)"; e.currentTarget.style.color = "#ef4444"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.12)"; e.currentTarget.style.background = "rgba(var(--color-primary-rgb) / 0.02)"; e.currentTarget.style.color = "inherit"; }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {/* Add button */}
          <button
            onClick={handleAddLogo}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl cursor-pointer text-[12px] font-semibold"
            style={{
              border: "1.5px dashed rgba(var(--color-primary-rgb) / 0.2)",
              color: "var(--color-primary)",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-primary)"; e.currentTarget.style.background = "rgba(var(--color-primary-rgb) / 0.04)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.2)"; e.currentTarget.style.background = "transparent"; }}
          >
            <Plus className="h-3.5 w-3.5" />
            {isAr ? "إضافة شعار" : "Add Logo"}
          </button>
        </div>
      </SectionCard>
    </div>
  );
}
