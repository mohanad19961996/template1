"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useSiteConfig } from "@/providers/site-config-provider";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  X,
  CreditCard,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import type { PricingPlan } from "@/lib/site-config";

/* ── TextInput ── */
function TextInput({
  label,
  value,
  onChange,
  placeholder,
  dir,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  dir?: string;
}) {
  return (
    <div className="space-y-1">
      <label
        className="text-[11px] font-semibold uppercase tracking-wider"
        style={{ opacity: 0.5 }}
      >
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir={dir}
        className="w-full h-9 px-3 rounded-lg text-[13px] font-medium outline-none"
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

/* ── TextArea ── */
function TextArea({
  label,
  value,
  onChange,
  placeholder,
  dir,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  dir?: string;
}) {
  return (
    <div className="space-y-1">
      <label
        className="text-[11px] font-semibold uppercase tracking-wider"
        style={{ opacity: 0.5 }}
      >
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir={dir}
        rows={2}
        className="w-full px-3 py-2 rounded-lg text-[13px] font-medium outline-none resize-none"
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

export function PricingEditorContent() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const { config, updatePricingPlans } = useSiteConfig();
  const plans = config.pricingPlans ?? [];
  const BackArrow = isAr ? ArrowRight : ArrowLeft;

  const update = (index: number, updates: Partial<PricingPlan>) => {
    const next = plans.map((p, i) => (i === index ? { ...p, ...updates } : p));
    updatePricingPlans(next);
  };

  const addPlan = () => {
    updatePricingPlans([
      ...plans,
      {
        id: Date.now().toString(),
        nameEn: "",
        nameAr: "",
        priceMonthly: "",
        priceYearly: "",
        descriptionEn: "",
        descriptionAr: "",
        featuresEn: [],
        featuresAr: [],
        popular: false,
        ctaEn: "Get Started",
        ctaAr: "ابدأ الآن",
      },
    ]);
  };

  const removePlan = (index: number) => {
    updatePricingPlans(plans.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen pb-20" style={{ color: "var(--color-foreground)" }}>
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="pt-8 pb-6">
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 py-2 px-3 rounded-xl text-[12px] font-medium cursor-pointer"
              style={{
                border: "1.5px solid rgba(var(--color-primary-rgb) / 0.1)",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.3)";
                e.currentTarget.style.background = "rgba(var(--color-primary-rgb) / 0.04)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.1)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <BackArrow className="h-3.5 w-3.5" />
              {isAr ? "لوحة التحكم" : "Dashboard"}
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(var(--color-primary-rgb) / 0.1)" }}
            >
              <CreditCard className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                {isAr ? "محرر الأسعار" : "Pricing Editor"}
              </h1>
              <p className="text-[12px] mt-0.5" style={{ opacity: 0.4 }}>
                {isAr ? "إدارة خطط الأسعار" : "Manage pricing plans"}
              </p>
            </div>
          </div>
        </div>

        {/* Cards */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        >
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="rounded-2xl p-5 relative"
              style={{
                border: plan.popular
                  ? "2px solid rgba(var(--color-primary-rgb) / 0.3)"
                  : "2px solid rgba(var(--color-primary-rgb) / 0.08)",
                background: "var(--color-card)",
              }}
            >
              {/* Remove button */}
              <button
                onClick={() => removePlan(index)}
                className="absolute top-3 right-3 p-1.5 rounded-lg cursor-pointer"
                style={{
                  background: "rgba(239, 68, 68, 0.08)",
                  color: "rgb(239, 68, 68)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)";
                }}
              >
                <X className="h-3.5 w-3.5" />
              </button>

              <div className="space-y-4">
                {/* Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <TextInput
                    label={isAr ? "الاسم (إنجليزي)" : "Name (English)"}
                    value={plan.nameEn}
                    onChange={(v) => update(index, { nameEn: v })}
                    placeholder="Professional"
                  />
                  <TextInput
                    label={isAr ? "الاسم (عربي)" : "Name (Arabic)"}
                    value={plan.nameAr}
                    onChange={(v) => update(index, { nameAr: v })}
                    placeholder="احترافي"
                    dir="rtl"
                  />
                </div>

                {/* Prices */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <TextInput
                    label={isAr ? "السعر الشهري" : "Monthly Price"}
                    value={plan.priceMonthly}
                    onChange={(v) => update(index, { priceMonthly: v })}
                    placeholder="$29"
                  />
                  <TextInput
                    label={isAr ? "السعر السنوي" : "Yearly Price"}
                    value={plan.priceYearly}
                    onChange={(v) => update(index, { priceYearly: v })}
                    placeholder="$290"
                  />
                </div>

                {/* Description */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <TextArea
                    label={isAr ? "الوصف (إنجليزي)" : "Description (English)"}
                    value={plan.descriptionEn}
                    onChange={(v) => update(index, { descriptionEn: v })}
                    placeholder="Perfect for growing businesses"
                  />
                  <TextArea
                    label={isAr ? "الوصف (عربي)" : "Description (Arabic)"}
                    value={plan.descriptionAr}
                    onChange={(v) => update(index, { descriptionAr: v })}
                    placeholder="مثالي للشركات النامية"
                    dir="rtl"
                  />
                </div>

                {/* Features (comma separated) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <TextArea
                    label={isAr ? "الميزات (إنجليزي، مفصولة بفاصلة)" : "Features (English, comma separated)"}
                    value={plan.featuresEn.join(", ")}
                    onChange={(v) =>
                      update(index, {
                        featuresEn: v
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="Unlimited users, 24/7 support, API access"
                  />
                  <TextArea
                    label={isAr ? "الميزات (عربي، مفصولة بفاصلة)" : "Features (Arabic, comma separated)"}
                    value={plan.featuresAr.join(", ")}
                    onChange={(v) =>
                      update(index, {
                        featuresAr: v
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="مستخدمون غير محدودون، دعم على مدار الساعة"
                    dir="rtl"
                  />
                </div>

                {/* CTA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <TextInput
                    label={isAr ? "زر الإجراء (إنجليزي)" : "CTA Text (English)"}
                    value={plan.ctaEn}
                    onChange={(v) => update(index, { ctaEn: v })}
                    placeholder="Get Started"
                  />
                  <TextInput
                    label={isAr ? "زر الإجراء (عربي)" : "CTA Text (Arabic)"}
                    value={plan.ctaAr}
                    onChange={(v) => update(index, { ctaAr: v })}
                    placeholder="ابدأ الآن"
                    dir="rtl"
                  />
                </div>

                {/* Popular toggle */}
                <button
                  type="button"
                  onClick={() => update(index, { popular: !plan.popular })}
                  className="flex items-center gap-2.5 py-2 cursor-pointer"
                >
                  {plan.popular ? (
                    <ToggleRight size={24} style={{ color: "var(--color-primary)" }} />
                  ) : (
                    <ToggleLeft size={24} style={{ opacity: 0.3 }} />
                  )}
                  <span
                    className="text-[13px] font-medium"
                    style={{
                      color: plan.popular ? "var(--color-primary)" : "inherit",
                      opacity: plan.popular ? 1 : 0.6,
                    }}
                  >
                    {isAr ? "خطة مميزة" : "Popular Plan"}
                  </span>
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Add button */}
        <button
          onClick={addPlan}
          className="w-full mt-4 py-3 rounded-2xl flex items-center justify-center gap-2 text-[13px] font-semibold cursor-pointer"
          style={{
            background: "var(--color-primary)",
            color: "#fff",
            transition: "opacity 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.85";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
        >
          <Plus className="h-4 w-4" />
          {isAr ? "إضافة خطة" : "Add Plan"}
        </button>

        {/* Footer hint */}
        <div className="mt-6 text-center">
          <p className="text-[11px]" style={{ opacity: 0.3 }}>
            {isAr ? "التغييرات تُحفظ تلقائيًا" : "Changes are saved automatically"}
          </p>
        </div>
      </div>
    </div>
  );
}
