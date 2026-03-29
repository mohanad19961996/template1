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
  Footprints,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import type { SocialLink } from "@/lib/site-config";

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

export function FooterEditorContent() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const { config, updateFooterContent } = useSiteConfig();
  const footer = config.footerContent;
  const BackArrow = isAr ? ArrowRight : ArrowLeft;

  const updateSocialLink = (index: number, updates: Partial<SocialLink>) => {
    const next = footer.socialLinks.map((link, i) =>
      i === index ? { ...link, ...updates } : link
    );
    updateFooterContent({ socialLinks: next });
  };

  const addSocialLink = () => {
    updateFooterContent({
      socialLinks: [
        ...footer.socialLinks,
        { platform: "", url: "", visible: true },
      ],
    });
  };

  const removeSocialLink = (index: number) => {
    updateFooterContent({
      socialLinks: footer.socialLinks.filter((_, i) => i !== index),
    });
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
              <Footprints className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                {isAr ? "محرر التذييل" : "Footer Editor"}
              </h1>
              <p className="text-[12px] mt-0.5" style={{ opacity: 0.4 }}>
                {isAr ? "إدارة محتوى التذييل" : "Manage footer content"}
              </p>
            </div>
          </div>
        </div>

        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Description & Copyright */}
          <div
            className="rounded-2xl p-5"
            style={{
              border: "2px solid rgba(var(--color-primary-rgb) / 0.08)",
              background: "var(--color-card)",
            }}
          >
            <div className="space-y-4">
              {/* Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <TextArea
                  label={isAr ? "الوصف (إنجليزي)" : "Description (English)"}
                  value={footer.descriptionEn}
                  onChange={(v) => updateFooterContent({ descriptionEn: v })}
                  placeholder="Company description..."
                />
                <TextArea
                  label={isAr ? "الوصف (عربي)" : "Description (Arabic)"}
                  value={footer.descriptionAr}
                  onChange={(v) => updateFooterContent({ descriptionAr: v })}
                  placeholder="وصف الشركة..."
                  dir="rtl"
                />
              </div>

              {/* Copyright */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <TextInput
                  label={isAr ? "حقوق النشر (إنجليزي)" : "Copyright (English)"}
                  value={footer.copyrightEn}
                  onChange={(v) => updateFooterContent({ copyrightEn: v })}
                  placeholder="© 2024 Company. All rights reserved."
                />
                <TextInput
                  label={isAr ? "حقوق النشر (عربي)" : "Copyright (Arabic)"}
                  value={footer.copyrightAr}
                  onChange={(v) => updateFooterContent({ copyrightAr: v })}
                  placeholder="© 2024 الشركة. جميع الحقوق محفوظة."
                  dir="rtl"
                />
              </div>
            </div>
          </div>

          {/* Social Links header */}
          <div className="pt-2">
            <h2
              className="text-[13px] font-bold uppercase tracking-wider"
              style={{ color: "var(--color-primary)" }}
            >
              {isAr ? "روابط التواصل الاجتماعي" : "Social Links"}
            </h2>
          </div>

          {/* Social Link Cards */}
          {footer.socialLinks.map((link, index) => (
            <motion.div
              key={index}
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
                onClick={() => removeSocialLink(index)}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <TextInput
                    label={isAr ? "المنصة" : "Platform"}
                    value={link.platform}
                    onChange={(v) => updateSocialLink(index, { platform: v })}
                    placeholder="Twitter"
                  />
                  <TextInput
                    label={isAr ? "الرابط" : "URL"}
                    value={link.url}
                    onChange={(v) => updateSocialLink(index, { url: v })}
                    placeholder="https://twitter.com/username"
                  />
                </div>

                {/* Visibility toggle */}
                <button
                  type="button"
                  onClick={() =>
                    updateSocialLink(index, { visible: !link.visible })
                  }
                  className="flex items-center gap-2.5 py-1 cursor-pointer"
                >
                  {link.visible ? (
                    <ToggleRight
                      size={24}
                      style={{ color: "var(--color-primary)" }}
                    />
                  ) : (
                    <ToggleLeft size={24} style={{ opacity: 0.3 }} />
                  )}
                  <span
                    className="text-[13px] font-medium"
                    style={{
                      color: link.visible ? "var(--color-primary)" : "inherit",
                      opacity: link.visible ? 1 : 0.6,
                    }}
                  >
                    {isAr ? "مرئي" : "Visible"}
                  </span>
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Add social link button */}
        <button
          onClick={addSocialLink}
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
          {isAr ? "إضافة رابط" : "Add Social Link"}
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
