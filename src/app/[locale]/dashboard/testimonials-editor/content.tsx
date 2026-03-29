"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useSiteConfig } from "@/providers/site-config-provider";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Plus, X, MessageSquare, Star } from "lucide-react";
import type { TestimonialItem } from "@/lib/site-config";

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
        rows={3}
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

/* ── Rating Selector ── */
function RatingSelector({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <label
        className="text-[11px] font-semibold uppercase tracking-wider"
        style={{ opacity: 0.5 }}
      >
        {label}
      </label>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onChange(star)}
            className="cursor-pointer p-0.5"
          >
            <Star
              className="h-5 w-5"
              style={{
                color: star <= value ? "var(--color-primary)" : "rgba(var(--color-primary-rgb) / 0.15)",
                fill: star <= value ? "var(--color-primary)" : "transparent",
                transition: "all 0.15s ease",
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export function TestimonialsEditorContent() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const { config, updateTestimonialItems } = useSiteConfig();
  const items = config.testimonialItems ?? [];
  const BackArrow = isAr ? ArrowRight : ArrowLeft;

  const update = (index: number, updates: Partial<TestimonialItem>) => {
    const next = items.map((item, i) => (i === index ? { ...item, ...updates } : item));
    updateTestimonialItems(next);
  };

  const addItem = () => {
    updateTestimonialItems([
      ...items,
      {
        id: Date.now().toString(),
        nameEn: "",
        nameAr: "",
        roleEn: "",
        roleAr: "",
        company: "",
        quoteEn: "",
        quoteAr: "",
        rating: 5,
        image: "",
      },
    ]);
  };

  const removeItem = (index: number) => {
    updateTestimonialItems(items.filter((_, i) => i !== index));
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
              <MessageSquare className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                {isAr ? "محرر الشهادات" : "Testimonials Editor"}
              </h1>
              <p className="text-[12px] mt-0.5" style={{ opacity: 0.4 }}>
                {isAr ? "إدارة شهادات العملاء" : "Manage client testimonials"}
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
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="rounded-2xl p-5 relative"
              style={{
                border: "2px solid rgba(var(--color-primary-rgb) / 0.08)",
                background: "var(--color-card)",
              }}
            >
              {/* Remove button */}
              <button
                onClick={() => removeItem(index)}
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
                    value={item.nameEn}
                    onChange={(v) => update(index, { nameEn: v })}
                    placeholder="Jane Smith"
                  />
                  <TextInput
                    label={isAr ? "الاسم (عربي)" : "Name (Arabic)"}
                    value={item.nameAr}
                    onChange={(v) => update(index, { nameAr: v })}
                    placeholder="جين سميث"
                    dir="rtl"
                  />
                </div>

                {/* Role */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <TextInput
                    label={isAr ? "الدور (إنجليزي)" : "Role (English)"}
                    value={item.roleEn}
                    onChange={(v) => update(index, { roleEn: v })}
                    placeholder="Marketing Director"
                  />
                  <TextInput
                    label={isAr ? "الدور (عربي)" : "Role (Arabic)"}
                    value={item.roleAr}
                    onChange={(v) => update(index, { roleAr: v })}
                    placeholder="مدير التسويق"
                    dir="rtl"
                  />
                </div>

                {/* Company */}
                <TextInput
                  label={isAr ? "الشركة" : "Company"}
                  value={item.company}
                  onChange={(v) => update(index, { company: v })}
                  placeholder="Acme Inc."
                />

                {/* Quote */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <TextArea
                    label={isAr ? "الاقتباس (إنجليزي)" : "Quote (English)"}
                    value={item.quoteEn}
                    onChange={(v) => update(index, { quoteEn: v })}
                    placeholder="Their service was exceptional..."
                  />
                  <TextArea
                    label={isAr ? "الاقتباس (عربي)" : "Quote (Arabic)"}
                    value={item.quoteAr}
                    onChange={(v) => update(index, { quoteAr: v })}
                    placeholder="خدمتهم كانت استثنائية..."
                    dir="rtl"
                  />
                </div>

                {/* Rating + Image */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <RatingSelector
                    label={isAr ? "التقييم" : "Rating"}
                    value={item.rating}
                    onChange={(v) => update(index, { rating: v })}
                  />
                  <TextInput
                    label={isAr ? "رابط الصورة" : "Image URL"}
                    value={item.image}
                    onChange={(v) => update(index, { image: v })}
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Add button */}
        <button
          onClick={addItem}
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
          {isAr ? "إضافة شهادة" : "Add Testimonial"}
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
