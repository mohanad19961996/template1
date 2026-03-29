"use client";

import { useTranslations, useLocale } from "next-intl";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { SectionDivider } from "@/components/shared/section-divider";
import { useSiteConfig } from "@/providers/site-config-provider";
import { DEFAULT_PAGES_CONTENT } from "@/lib/site-config";
import {
  MapPin, Phone, Mail, Clock, Send,
  ArrowRight, ArrowLeft, ChevronDown, Check,
  Twitter, Linkedin, Instagram, Github, Dribbble,
  Plus, Minus, Sparkles,
} from "lucide-react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import Image from "next/image";

/* ───── animation presets ───── */
const ease = [0.16, 1, 0.3, 1] as const;

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
};

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease },
});

/* ───── reusable input focus handlers ───── */
const inputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.4)";
  e.currentTarget.style.boxShadow =
    "0 0 0 4px rgba(var(--color-primary-rgb) / 0.08), 0 0 20px rgba(var(--color-primary-rgb) / 0.06)";
};
const inputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.1)";
  e.currentTarget.style.boxShadow = "none";
};

const inputStyle: React.CSSProperties = {
  border: "1px solid rgba(var(--color-primary-rgb) / 0.1)",
  background: "rgba(var(--color-primary-rgb) / 0.02)",
  transition: "border-color 0.3s ease, box-shadow 0.3s ease, background 0.3s ease",
};

/* ═══════════════════════════════════════════════════════════════════ */

export function ContactContent() {
  const t = useTranslations("contact");
  const tc = useTranslations("common");
  const locale = useLocale();
  const isAr = locale === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;
  const tx = (en: string, ar: string) => isAr ? ar : en;

  const { config } = useSiteConfig();
  const sections = config.pagesContent?.contact?.sections ?? DEFAULT_PAGES_CONTENT.contact.sections;

  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  /* ── form state ── */
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    service: "",
    budget: "",
    message: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formError) setFormError("");
  };

  const heroRef = useRef(null);
  const stripRef = useRef(null);
  const formRef = useRef(null);
  const mapRef = useRef(null);
  const faqRef = useRef(null);
  const socialRef = useRef(null);

  const stripInView = useInView(stripRef, { once: true, margin: "-60px" });
  const formInView = useInView(formRef, { once: true, margin: "-60px" });
  const mapInView = useInView(mapRef, { once: true, margin: "-60px" });
  const faqInView = useInView(faqRef, { once: true, margin: "-60px" });
  const socialInView = useInView(socialRef, { once: true, margin: "-60px" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setFormError(data.error || (isAr ? "حدث خطأ، يرجى المحاولة لاحقاً" : "Something went wrong. Please try again."));
        return;
      }

      setSubmitted(true);
      setFormData({ name: "", email: "", phone: "", subject: "", service: "", budget: "", message: "" });
      setTimeout(() => setSubmitted(false), 5000);
    } catch {
      setFormError(isAr ? "تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً" : "Could not reach the server. Please try again later.");
    } finally {
      setFormLoading(false);
    }
  };

  /* ── data ── */
  const contactMethods = [
    {
      icon: MapPin,
      label: isAr ? "العنوان" : "Address",
      value: isAr ? "الرياض، المملكة العربية السعودية" : "Riyadh, Saudi Arabia",
    },
    {
      icon: Phone,
      label: isAr ? "الهاتف" : "Phone",
      value: "+966 50 000 1234",
    },
    {
      icon: Mail,
      label: isAr ? "البريد الإلكتروني" : "Email",
      value: "hello@template.sa",
    },
    {
      icon: Clock,
      label: isAr ? "ساعات العمل" : "Working Hours",
      value: isAr ? "الأحد - الخميس: 9ص - 6م" : "Sun - Thu: 9AM - 6PM",
    },
  ];

  const services = isAr
    ? ["تطوير الويب", "تطوير الجوال", "تصميم UI/UX", "التسويق الرقمي", "العلامة التجارية", "الاستشارات"]
    : ["Web Development", "Mobile Development", "UI/UX Design", "Digital Marketing", "Branding", "Consulting"];

  const budgets = isAr
    ? ["أقل من 5,000$", "5,000$ - 10,000$", "10,000$ - 25,000$", "25,000$ - 50,000$", "أكثر من 50,000$"]
    : ["Under $5K", "$5K - $10K", "$10K - $25K", "$25K - $50K", "$50K+"];

  const faqs = [
    {
      q: isAr ? "ما مدى سرعة ردكم؟" : "How quickly do you respond?",
      a: isAr
        ? "نرد عادةً خلال 2-4 ساعات عمل. الرسائل العاجلة تُعالج فوراً خلال ساعة واحدة."
        : "We typically respond within 2-4 business hours. Urgent inquiries are prioritized and handled within 1 hour during working days.",
    },
    {
      q: isAr ? "هل تقدمون استشارات مجانية؟" : "Do you offer free consultations?",
      a: isAr
        ? "نعم! نقدم استشارة مجانية لمدة 30 دقيقة لمناقشة مشروعك وأهدافك ونطاق العمل المطلوب."
        : "Yes! We offer a complimentary 30-minute consultation to discuss your project goals, requirements, and how we can best help bring your vision to life.",
    },
    {
      q: isAr ? "ما هو الجدول الزمني النموذجي للمشروع؟" : "What's your typical project timeline?",
      a: isAr
        ? "يعتمد على نطاق المشروع. المواقع البسيطة تستغرق 2-4 أسابيع، بينما المشاريع الكبيرة قد تستغرق 8-16 أسبوعاً."
        : "Timelines vary by scope. Simple websites take 2-4 weeks, while complex applications may take 8-16 weeks. We provide detailed timelines during our initial consultation.",
    },
  ];

  const socials = [
    { icon: Twitter, label: "Twitter / X", href: "#" },
    { icon: Linkedin, label: "LinkedIn", href: "#" },
    { icon: Instagram, label: "Instagram", href: "#" },
    { icon: Github, label: "GitHub", href: "#" },
    { icon: Dribbble, label: "Dribbble", href: "#" },
  ];

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════
          1. PREMIUM HERO — CSS gradient, no image
      ═══════════════════════════════════════════════════════════ */}
      {sections.hero?.visible !== false && (
      <section ref={heroRef} className="relative overflow-hidden" style={{ minHeight: 440 }}>
        {/* radial gradient bg */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 50% 40%, rgba(var(--color-primary-rgb) / 0.18) 0%, transparent 70%),
              radial-gradient(ellipse 50% 80% at 80% 20%, rgba(var(--color-primary-rgb) / 0.10) 0%, transparent 60%),
              radial-gradient(ellipse 40% 60% at 20% 80%, rgba(var(--color-primary-rgb) / 0.08) 0%, transparent 60%),
              var(--color-background)
            `,
          }}
        />

        {/* grid pattern overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(var(--color-primary-rgb) / 0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(var(--color-primary-rgb) / 0.04) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />

        {/* floating orbs */}
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 300, height: 300, top: "10%", right: "-5%",
            background: "radial-gradient(circle, rgba(var(--color-primary-rgb) / 0.08), transparent 70%)",
            filter: "blur(40px)",
          }}
          animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 200, height: 200, bottom: "5%", left: "10%",
            background: "radial-gradient(circle, rgba(var(--color-primary-rgb) / 0.06), transparent 70%)",
            filter: "blur(30px)",
          }}
          animate={{ y: [0, 15, 0], x: [0, -8, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />

        <Container size="sm">
          <div
            className="relative z-10 flex flex-col items-center justify-center text-center"
            style={{ minHeight: 440, paddingBlock: "var(--section-y)" }}
          >
            {/* badge */}
            <motion.div {...fadeUp(0)}>
              <span
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase"
                style={{
                  background: "rgba(var(--color-primary-rgb) / 0.08)",
                  color: "var(--color-primary)",
                  border: "1px solid rgba(var(--color-primary-rgb) / 0.12)",
                }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                {isAr ? "تواصل معنا" : "Get In Touch"}
              </span>
            </motion.div>

            {/* title */}
            <motion.h1
              className="font-bold tracking-tight mt-6"
              style={{
                fontSize: "clamp(2rem, 5vw, 3.75rem)",
                lineHeight: 1.1,
                color: "var(--color-foreground)",
              }}
              {...fadeUp(0.15)}
            >
              {t("title")}
            </motion.h1>

            {/* subtitle */}
            <motion.p
              className="max-w-lg mx-auto mt-4 leading-relaxed"
              style={{ color: "rgba(var(--color-primary-rgb) / 0.6)", fontSize: "clamp(0.875rem, 1.5vw, 1.05rem)" }}
              {...fadeUp(0.3)}
            >
              {t("description")}
            </motion.p>

            {/* scroll indicator */}
            <motion.div className="mt-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
              >
                <ChevronDown className="h-5 w-5" style={{ color: "rgba(var(--color-primary-rgb) / 0.35)" }} />
              </motion.div>
            </motion.div>
          </div>
        </Container>

        {/* bottom gradient fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
          style={{ background: "linear-gradient(to top, var(--color-background), transparent)" }}
        />
      </section>
      )}

      {/* ═══════════════════════════════════════════════════════════
          2. CONTACT METHODS STRIP
      ═══════════════════════════════════════════════════════════ */}
      {sections.info?.visible !== false && (
      <section ref={stripRef} style={{ paddingBlock: "var(--section-y)" }}>
        <Container>
          <motion.div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            variants={containerVariants}
            initial="hidden"
            animate={stripInView ? "visible" : "hidden"}
          >
            {contactMethods.map((item, i) => (
              <motion.div
                key={item.label}
                variants={itemVariants}
                className="group relative rounded-2xl p-5 cursor-default"
                style={{
                  background: "var(--color-card)",
                  border: "1px solid rgba(var(--color-primary-rgb) / 0.06)",
                  transition: "border-color 0.4s ease, transform 0.4s ease, box-shadow 0.4s ease",
                }}
                whileHover={{
                  y: -4,
                  borderColor: "rgba(var(--color-primary-rgb) / 0.2)",
                  boxShadow: "0 8px 32px rgba(var(--color-primary-rgb) / 0.08), 0 0 0 1px rgba(var(--color-primary-rgb) / 0.1)",
                }}
              >
                {/* icon container */}
                <div
                  className="h-11 w-11 rounded-xl flex items-center justify-center mb-4"
                  style={{
                    background: "rgba(var(--color-primary-rgb) / 0.08)",
                    color: "var(--color-primary)",
                    border: "1px solid rgba(var(--color-primary-rgb) / 0.1)",
                    boxShadow: "0 0 16px rgba(var(--color-primary-rgb) / 0.06)",
                    transition: "box-shadow 0.4s ease",
                  }}
                >
                  <item.icon className="h-5 w-5" />
                </div>

                <p
                  className="text-[11px] font-semibold uppercase tracking-wider mb-1"
                  style={{ color: "rgba(var(--color-primary-rgb) / 0.5)" }}
                >
                  {item.label}
                </p>
                <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
                  {item.value}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </Container>
      </section>
      )}

      <SectionDivider />

      {/* ═══════════════════════════════════════════════════════════
          3. CONTACT FORM SECTION — split layout
      ═══════════════════════════════════════════════════════════ */}
      {sections.form?.visible !== false && (
      <section ref={formRef} style={{ paddingBlock: "var(--section-y)" }}>
        <Container>
          <motion.div
            className="grid gap-10 lg:gap-14 lg:grid-cols-5"
            variants={containerVariants}
            initial="hidden"
            animate={formInView ? "visible" : "hidden"}
          >
            {/* LEFT — heading & decorative */}
            <motion.div variants={itemVariants} className="lg:col-span-2 flex flex-col justify-center">
              <span
                className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase mb-3"
                style={{ color: "var(--color-primary)" }}
              >
                <span className="h-px w-5" style={{ background: "var(--color-primary)" }} />
                {isAr ? "تواصل" : "Contact"}
              </span>

              <h2
                className="font-bold tracking-tight mb-4"
                style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", lineHeight: 1.15, color: "var(--color-foreground)" }}
              >
                {isAr ? "لنبدأ محادثة" : "Let's Start a Conversation"}
              </h2>

              {/* decorative line */}
              <div
                className="h-1 w-12 rounded-full mb-5"
                style={{
                  background: "linear-gradient(90deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.2))",
                }}
              />

              <p className="text-sm leading-relaxed mb-8" style={{ color: "rgba(var(--color-primary-rgb) / 0.55)" }}>
                {isAr
                  ? "نحن متحمسون لسماع أفكارك. أخبرنا عن مشروعك ودعنا نحوله إلى واقع رقمي مذهل. فريقنا جاهز لمساعدتك في كل خطوة."
                  : "We're excited to hear your ideas. Tell us about your project and let us transform it into a stunning digital reality. Our team is ready to guide you every step of the way."}
              </p>

              {/* decorative dots pattern */}
              <div className="hidden lg:block">
                <div className="grid grid-cols-5 gap-3 max-w-[140px]">
                  {Array.from({ length: 15 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: "rgba(var(--color-primary-rgb) / 0.12)" }}
                      animate={{ opacity: [0.3, 0.8, 0.3] }}
                      transition={{ duration: 3, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>

            {/* RIGHT — premium form card */}
            <motion.div variants={itemVariants} className="lg:col-span-3">
              <div
                className="relative rounded-2xl p-6 md:p-8"
                style={{
                  background: "var(--color-card)",
                  border: "1px solid rgba(var(--color-primary-rgb) / 0.08)",
                  boxShadow:
                    "0 4px 32px rgba(var(--color-primary-rgb) / 0.04), 0 1px 4px rgba(var(--color-primary-rgb) / 0.02)",
                }}
              >
                {/* subtle top accent line */}
                <div
                  className="absolute top-0 left-8 right-8 h-px"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(var(--color-primary-rgb) / 0.2), transparent)",
                  }}
                />

                <AnimatePresence mode="wait">
                  {submitted ? (
                    /* ── success state ── */
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.4, ease }}
                      className="text-center py-16"
                    >
                      {/* animated checkmark */}
                      <motion.div
                        className="h-20 w-20 rounded-full mx-auto flex items-center justify-center mb-6"
                        style={{
                          background: "rgba(var(--color-primary-rgb) / 0.08)",
                          border: "2px solid rgba(var(--color-primary-rgb) / 0.15)",
                        }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.2 }}
                      >
                        <motion.div
                          initial={{ scale: 0, rotate: -45 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 250, damping: 15, delay: 0.5 }}
                        >
                          <Check
                            className="h-9 w-9"
                            strokeWidth={2.5}
                            style={{ color: "var(--color-primary)" }}
                          />
                        </motion.div>
                      </motion.div>

                      {/* pulsing ring */}
                      <motion.div
                        className="absolute rounded-full pointer-events-none"
                        style={{
                          width: 120, height: 120,
                          top: "50%", left: "50%",
                          transform: "translate(-50%, -80%)",
                          border: "2px solid rgba(var(--color-primary-rgb) / 0.1)",
                        }}
                        animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                      />

                      <h3
                        className="text-lg font-bold mb-2"
                        style={{ color: "var(--color-foreground)" }}
                      >
                        {t("success")}
                      </h3>
                      <p className="text-sm" style={{ color: "rgba(var(--color-primary-rgb) / 0.5)" }}>
                        {isAr ? "سنتواصل معك في أقرب وقت ممكن" : "We'll get back to you as soon as possible"}
                      </p>
                    </motion.div>
                  ) : (
                    /* ── form ── */
                    <motion.form
                      key="form"
                      onSubmit={handleSubmit}
                      className="space-y-5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {/* form header */}
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className="h-9 w-9 rounded-xl flex items-center justify-center"
                          style={{
                            background: "rgba(var(--color-primary-rgb) / 0.08)",
                            color: "var(--color-primary)",
                            border: "1px solid rgba(var(--color-primary-rgb) / 0.1)",
                          }}
                        >
                          <Send className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold" style={{ color: "var(--color-foreground)" }}>
                            {isAr ? "أرسل رسالتك" : "Send Your Message"}
                          </h3>
                          <p className="text-[11px]" style={{ color: "rgba(var(--color-primary-rgb) / 0.4)" }}>
                            {isAr ? "جميع الحقول مطلوبة" : "All fields are required"}
                          </p>
                        </div>
                      </div>

                      {/* name + email row */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block"
                            style={{ color: "rgba(var(--color-primary-rgb) / 0.5)" }}>
                            {tc("name")}
                          </label>
                          <input
                            type="text"
                            required
                            placeholder={isAr ? "الاسم الكامل" : "Full name"}
                            className="w-full h-11 px-4 rounded-xl text-sm outline-none"
                            style={{ ...inputStyle, color: "var(--color-foreground)" }}
                            value={formData.name}
                            onChange={(e) => updateField("name", e.target.value)}
                            onFocus={inputFocus}
                            onBlur={inputBlur}
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block"
                            style={{ color: "rgba(var(--color-primary-rgb) / 0.5)" }}>
                            {tc("email")}
                          </label>
                          <input
                            type="email"
                            required
                            placeholder={isAr ? "البريد الإلكتروني" : "you@example.com"}
                            className="w-full h-11 px-4 rounded-xl text-sm outline-none"
                            style={{ ...inputStyle, color: "var(--color-foreground)" }}
                            value={formData.email}
                            onChange={(e) => updateField("email", e.target.value)}
                            onFocus={inputFocus}
                            onBlur={inputBlur}
                          />
                        </div>
                      </div>

                      {/* phone */}
                      <div>
                        <label className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block"
                          style={{ color: "rgba(var(--color-primary-rgb) / 0.5)" }}>
                          {tc("phone")}
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder={isAr ? "رقم الهاتف" : "+966 5X XXX XXXX"}
                          className="w-full h-11 px-4 rounded-xl text-sm outline-none"
                          style={{ ...inputStyle, color: "var(--color-foreground)" }}
                          value={formData.phone}
                          onChange={(e) => updateField("phone", e.target.value)}
                          onFocus={inputFocus}
                          onBlur={inputBlur}
                        />
                      </div>

                      {/* subject */}
                      <div>
                        <label className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block"
                          style={{ color: "rgba(var(--color-primary-rgb) / 0.5)" }}>
                          {tc("subject")}
                        </label>
                        <input
                          type="text"
                          required
                          placeholder={isAr ? "موضوع الرسالة" : "What's this about?"}
                          className="w-full h-11 px-4 rounded-xl text-sm outline-none"
                          style={{ ...inputStyle, color: "var(--color-foreground)" }}
                          value={formData.subject}
                          onChange={(e) => updateField("subject", e.target.value)}
                          onFocus={inputFocus}
                          onBlur={inputBlur}
                        />
                      </div>

                      {/* service + budget row */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block"
                            style={{ color: "rgba(var(--color-primary-rgb) / 0.5)" }}>
                            {isAr ? "الخدمة" : "Service"}
                          </label>
                          <select
                            required
                            className="w-full h-11 px-4 rounded-xl text-sm outline-none appearance-none cursor-pointer"
                            style={{ ...inputStyle, color: "var(--color-foreground)" }}
                            value={formData.service}
                            onChange={(e) => updateField("service", e.target.value)}
                            onFocus={inputFocus}
                            onBlur={inputBlur}
                          >
                            <option value="">{isAr ? "اختر الخدمة" : "Select a service"}</option>
                            {services.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block"
                            style={{ color: "rgba(var(--color-primary-rgb) / 0.5)" }}>
                            {isAr ? "الميزانية" : "Budget Range"}
                          </label>
                          <select
                            required
                            className="w-full h-11 px-4 rounded-xl text-sm outline-none appearance-none cursor-pointer"
                            style={{ ...inputStyle, color: "var(--color-foreground)" }}
                            value={formData.budget}
                            onChange={(e) => updateField("budget", e.target.value)}
                            onFocus={inputFocus}
                            onBlur={inputBlur}
                          >
                            <option value="">{isAr ? "حدد الميزانية" : "Select budget"}</option>
                            {budgets.map((b) => (
                              <option key={b} value={b}>{b}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* message */}
                      <div>
                        <label className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block"
                          style={{ color: "rgba(var(--color-primary-rgb) / 0.5)" }}>
                          {tc("message")}
                        </label>
                        <textarea
                          rows={5}
                          required
                          placeholder={isAr ? "أخبرنا المزيد عن مشروعك..." : "Tell us more about your project..."}
                          className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                          style={{ ...inputStyle, color: "var(--color-foreground)" }}
                          value={formData.message}
                          onChange={(e) => updateField("message", e.target.value)}
                          onFocus={inputFocus}
                          onBlur={inputBlur}
                        />
                      </div>

                      {/* error message */}
                      {formError && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-xl px-4 py-3 text-sm font-medium"
                          style={{
                            background: "rgba(220, 38, 38, 0.08)",
                            color: "rgb(220, 38, 38)",
                            border: "1px solid rgba(220, 38, 38, 0.15)",
                          }}
                        >
                          {formError}
                        </motion.div>
                      )}

                      {/* submit button */}
                      <motion.button
                        type="submit"
                        disabled={formLoading}
                        className="w-full h-12 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                        style={{
                          background: "var(--color-primary)",
                          boxShadow:
                            "0 4px 20px rgba(var(--color-primary-rgb) / 0.3), 0 0 0 1px rgba(var(--color-primary-rgb) / 0.1)",
                          transition: "box-shadow 0.3s ease, transform 0.2s ease",
                        }}
                        whileHover={formLoading ? {} : {
                          boxShadow:
                            "0 8px 32px rgba(var(--color-primary-rgb) / 0.4), 0 0 0 1px rgba(var(--color-primary-rgb) / 0.2)",
                        }}
                        whileTap={formLoading ? {} : { scale: 0.98 }}
                      >
                        {formLoading ? (
                          <>
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            {isAr ? "جارٍ الإرسال..." : "Sending..."}
                          </>
                        ) : (
                          <>
                            {tc("sendMessage")}
                            <Arrow className="h-4 w-4" />
                          </>
                        )}
                      </motion.button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        </Container>
      </section>
      )}

      <SectionDivider />

      {/* ═══════════════════════════════════════════════════════════
          4. MAP SECTION
      ═══════════════════════════════════════════════════════════ */}
      {sections.map?.visible !== false && (
      <section ref={mapRef} style={{ paddingBlock: "var(--section-y)" }}>
        <Container>
          <SectionHeading
            title={sections.map?.titleEn ? tx(sections.map.titleEn, sections.map.titleAr) : tx("Find Us", "موقعنا")}
            subtitle={sections.map?.subtitleEn ? tx(sections.map.subtitleEn, sections.map.subtitleAr) : tx("Location", "الموقع")}
            description={isAr ? "قم بزيارتنا في مكتبنا الرئيسي" : "Visit us at our headquarters"}
          />

          <motion.div
            className="relative rounded-2xl overflow-hidden"
            style={{
              height: "clamp(280px, 35vw, 420px)",
              border: "1px solid rgba(var(--color-primary-rgb) / 0.08)",
              boxShadow: "0 4px 24px rgba(var(--color-primary-rgb) / 0.04)",
            }}
            initial={{ opacity: 0, y: 24 }}
            animate={mapInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease }}
          >
            {/* map placeholder image */}
            <Image
              src="https://picsum.photos/seed/contact-map/1400/500"
              alt="Map"
              fill
              className="object-cover"
            />

            {/* monochromatic overlay */}
            <div
              className="absolute inset-0"
              style={{
                background: `
                  linear-gradient(180deg, rgba(var(--color-primary-rgb) / 0.12) 0%, rgba(var(--color-primary-rgb) / 0.04) 50%, rgba(var(--color-primary-rgb) / 0.15) 100%),
                  rgba(var(--color-primary-rgb) / 0.06)
                `,
                mixBlendMode: "multiply",
              }}
            />

            {/* pin marker */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="relative"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              >
                {/* shadow */}
                <motion.div
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full"
                  style={{
                    width: 24, height: 6,
                    background: "rgba(var(--color-primary-rgb) / 0.3)",
                    filter: "blur(3px)",
                  }}
                  animate={{ scale: [1, 0.8, 1], opacity: [0.4, 0.2, 0.4] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* outer glow ring */}
                <div
                  className="absolute -inset-4 rounded-full"
                  style={{
                    background: "radial-gradient(circle, rgba(var(--color-primary-rgb) / 0.15), transparent 70%)",
                  }}
                />

                {/* pin */}
                <div
                  className="h-12 w-12 rounded-full flex items-center justify-center relative z-10"
                  style={{
                    background: "var(--color-primary)",
                    boxShadow:
                      "0 0 0 6px rgba(var(--color-primary-rgb) / 0.2), 0 0 0 12px rgba(var(--color-primary-rgb) / 0.08), 0 4px 20px rgba(var(--color-primary-rgb) / 0.35)",
                  }}
                >
                  <MapPin className="h-5 w-5 text-white" />
                </div>
              </motion.div>
            </div>

            {/* address label */}
            <div className="absolute bottom-4 left-4 right-4 flex justify-center">
              <div
                className="px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2"
                style={{
                  background: "var(--color-card)",
                  border: "1px solid rgba(var(--color-primary-rgb) / 0.1)",
                  color: "var(--color-foreground)",
                  boxShadow: "0 4px 16px rgba(var(--color-primary-rgb) / 0.06)",
                }}
              >
                <MapPin className="h-3.5 w-3.5" style={{ color: "var(--color-primary)" }} />
                {isAr ? "الرياض، المملكة العربية السعودية" : "Riyadh, Saudi Arabia"}
              </div>
            </div>
          </motion.div>
        </Container>
      </section>
      )}

      <SectionDivider />

      {/* ═══════════════════════════════════════════════════════════
          5. FAQ ABOUT CONTACT
      ═══════════════════════════════════════════════════════════ */}
      {sections.faq?.visible !== false && (
      <section ref={faqRef} style={{ paddingBlock: "var(--section-y)" }}>
        <Container size="sm">
          <SectionHeading
            title={sections.faq?.titleEn ? tx(sections.faq.titleEn, sections.faq.titleAr) : tx("Frequently Asked Questions", "الأسئلة الشائعة")}
            subtitle={sections.faq?.subtitleEn ? tx(sections.faq.subtitleEn, sections.faq.subtitleAr) : tx("FAQ", "أسئلة وأجوبة")}
            description={isAr ? "إجابات على الأسئلة الأكثر شيوعاً حول العمل معنا" : "Answers to common questions about working with us"}
          />

          <motion.div
            className="space-y-3"
            variants={containerVariants}
            initial="hidden"
            animate={faqInView ? "visible" : "hidden"}
          >
            {faqs.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: isOpen
                      ? "rgba(var(--color-primary-rgb) / 0.03)"
                      : "var(--color-card)",
                    border: `1px solid rgba(var(--color-primary-rgb) / ${isOpen ? "0.12" : "0.06"})`,
                    transition: "border-color 0.3s ease, background 0.3s ease",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full flex items-center justify-between gap-4 p-5 text-left cursor-pointer"
                    style={{ color: "var(--color-foreground)" }}
                  >
                    <span className="text-sm font-semibold">{faq.q}</span>
                    <div
                      className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center"
                      style={{
                        background: isOpen
                          ? "rgba(var(--color-primary-rgb) / 0.1)"
                          : "rgba(var(--color-primary-rgb) / 0.05)",
                        color: "var(--color-primary)",
                        transition: "background 0.3s ease",
                      }}
                    >
                      {isOpen ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease }}
                      >
                        <div
                          className="px-5 pb-5 text-sm leading-relaxed"
                          style={{ color: "rgba(var(--color-primary-rgb) / 0.55)" }}
                        >
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        </Container>
      </section>
      )}

      <SectionDivider />

      {/* ═══════════════════════════════════════════════════════════
          6. SOCIAL LINKS
      ═══════════════════════════════════════════════════════════ */}
      {sections.cta?.visible !== false && (
      <section ref={socialRef} style={{ paddingBlock: "var(--section-y)" }}>
        <Container size="sm">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={socialInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease }}
          >
            <h3
              className="text-lg font-bold mb-2"
              style={{ color: "var(--color-foreground)" }}
            >
              {isAr ? "تابعنا" : "Follow Us"}
            </h3>
            <p
              className="text-sm mb-8"
              style={{ color: "rgba(var(--color-primary-rgb) / 0.45)" }}
            >
              {isAr ? "ابقَ على تواصل عبر وسائل التواصل الاجتماعي" : "Stay connected through our social channels"}
            </p>

            <motion.div
              className="flex items-center justify-center gap-3 flex-wrap"
              variants={containerVariants}
              initial="hidden"
              animate={socialInView ? "visible" : "hidden"}
            >
              {socials.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  variants={itemVariants}
                  className="h-12 w-12 rounded-xl flex items-center justify-center cursor-pointer"
                  style={{
                    background: "rgba(var(--color-primary-rgb) / 0.04)",
                    color: "var(--color-foreground)",
                    border: "1px solid rgba(var(--color-primary-rgb) / 0.06)",
                    transition: "all 0.3s ease",
                  }}
                  whileHover={{
                    y: -3,
                    borderColor: "rgba(var(--color-primary-rgb) / 0.25)",
                    boxShadow: "0 4px 20px rgba(var(--color-primary-rgb) / 0.12), 0 0 0 1px rgba(var(--color-primary-rgb) / 0.08)",
                    color: "var(--color-primary)",
                    background: "rgba(var(--color-primary-rgb) / 0.08)",
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <social.icon className="h-5 w-5" />
                </motion.a>
              ))}
            </motion.div>
          </motion.div>
        </Container>
      </section>
      )}
    </>
  );
}
