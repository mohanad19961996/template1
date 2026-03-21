"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, useInView, useSpring, useMotionValue } from "framer-motion";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/shared/container";
import { SectionDivider } from "@/components/shared/section-divider";
import {
  Clock, Calendar, ChevronDown, ArrowRight, ArrowLeft,
  Quote, Mail, Linkedin, Globe, Twitter, Copy, Check,
  Heart, Share2, BookOpen, Tag, Send, Sparkles, Eye,
  Bookmark, MessageCircle, TrendingUp, Zap,
} from "lucide-react";

/* ─────────────────────────── DATA ─────────────────────────── */

interface Article {
  slug: string;
  titleEn: string;
  titleAr: string;
  excerptEn: string;
  excerptAr: string;
  image: string;
  authorEn: string;
  authorAr: string;
  authorRoleEn: string;
  authorRoleAr: string;
  authorAvatar: string;
  authorBioEn: string;
  authorBioAr: string;
  date: string;
  readTime: number;
  categoryEn: string;
  categoryAr: string;
  contentEn: string[];
  contentAr: string[];
  tagsEn: string[];
  tagsAr: string[];
  headingsEn: string[];
  headingsAr: string[];
}

const articles: Article[] = [
  {
    slug: "future-of-web-development-2025",
    titleEn: "The Future of Web Development in 2025",
    titleAr: "مستقبل تطوير الويب في 2025",
    excerptEn: "Exploring the latest trends shaping the future of web development, from AI-powered tools to edge computing.",
    excerptAr: "استكشاف أحدث الاتجاهات التي تشكل مستقبل تطوير الويب، من أدوات الذكاء الاصطناعي إلى الحوسبة الطرفية.",
    image: "https://picsum.photos/seed/blog1/1920/1080",
    authorEn: "Sarah Mitchell",
    authorAr: "سارة ميتشل",
    authorRoleEn: "Senior Developer",
    authorRoleAr: "مطورة أولى",
    authorAvatar: "https://picsum.photos/seed/author1/96/96",
    authorBioEn: "Sarah is a senior full-stack developer with over 10 years of experience building scalable web applications. She is passionate about emerging technologies and regularly speaks at international conferences.",
    authorBioAr: "سارة مطورة أولى متكاملة مع أكثر من 10 سنوات من الخبرة في بناء تطبيقات ويب قابلة للتوسع. شغوفة بالتقنيات الناشئة وتتحدث بانتظام في المؤتمرات الدولية.",
    date: "2025-12-15",
    readTime: 8,
    categoryEn: "Technology",
    categoryAr: "تكنولوجيا",
    headingsEn: ["The AI Revolution in Development", "Edge Computing Changes Everything", "WebAssembly Goes Mainstream", "What Comes Next"],
    headingsAr: ["ثورة الذكاء الاصطناعي في التطوير", "الحوسبة الطرفية تغير كل شيء", "WebAssembly يصبح سائداً", "ما الذي سيأتي بعد ذلك"],
    contentEn: [
      "The web development landscape is evolving at an unprecedented pace, driven by breakthroughs in artificial intelligence, cloud infrastructure, and user experience design. Developers who stay ahead of these trends will be well-positioned to build the next generation of web applications. The convergence of multiple technologies is creating opportunities that were unimaginable just a few years ago.",
      "One of the most significant trends is the rise of AI-powered development tools that can generate code, optimize performance, and even predict user behavior. These tools are not replacing developers but rather augmenting their capabilities, allowing them to focus on creative problem-solving and architecture. AI pair programming has become a standard practice in modern development teams, dramatically reducing time-to-market for new features.",
      "Edge computing is another game-changer, bringing computation closer to users and reducing latency to near-zero levels. Frameworks like Next.js and Remix are leading this charge, enabling developers to deploy server-side logic at the edge with minimal configuration. This shift has profound implications for global applications that need to serve users across different geographic regions with consistent performance.",
      "The adoption of WebAssembly continues to grow, enabling languages like Rust and C++ to run in the browser with near-native performance. This opens the door for complex applications like video editors, 3D modeling tools, and scientific simulations to run entirely in the browser. The gap between native and web applications is narrowing rapidly, making the browser an even more powerful platform.",
      "Looking ahead, the future of web development is bright and full of possibility. The combination of AI, edge computing, WebAssembly, and modern frameworks is creating a golden age for developers. Those who embrace these technologies and continue to learn will find themselves building applications that push the boundaries of what the web can do."
    ],
    contentAr: [
      "يتطور مشهد تطوير الويب بوتيرة غير مسبوقة، مدفوعًا بالاختراقات في الذكاء الاصطناعي والبنية التحتية السحابية وتصميم تجربة المستخدم. المطورون الذين يواكبون هذه الاتجاهات سيكونون في وضع جيد لبناء الجيل القادم من تطبيقات الويب. يخلق تقارب التقنيات المتعددة فرصًا لم تكن متخيلة قبل سنوات قليلة فقط.",
      "أحد أهم الاتجاهات هو صعود أدوات التطوير المدعومة بالذكاء الاصطناعي التي يمكنها إنشاء الكود وتحسين الأداء وحتى التنبؤ بسلوك المستخدم. هذه الأدوات لا تحل محل المطورين بل تعزز قدراتهم، مما يسمح لهم بالتركيز على حل المشكلات الإبداعية والهندسة المعمارية.",
      "الحوسبة الطرفية هي عامل تغيير آخر، تقرب الحوسبة من المستخدمين وتقلل زمن الاستجابة إلى مستويات شبه صفرية. تقود أطر العمل مثل Next.js و Remix هذا التحول، مما يمكّن المطورين من نشر المنطق من جانب الخادم على الحافة بأقل قدر من التكوين.",
      "يستمر اعتماد WebAssembly في النمو، مما يمكّن لغات مثل Rust و C++ من العمل في المتصفح بأداء شبه أصلي. هذا يفتح الباب لتطبيقات معقدة مثل محررات الفيديو وأدوات النمذجة ثلاثية الأبعاد للعمل بالكامل في المتصفح.",
      "بالنظر إلى المستقبل، مستقبل تطوير الويب مشرق ومليء بالإمكانيات. مزيج الذكاء الاصطناعي والحوسبة الطرفية و WebAssembly والأطر الحديثة يخلق عصرًا ذهبيًا للمطورين."
    ],
    tagsEn: ["Web Development", "AI", "Edge Computing", "WebAssembly"],
    tagsAr: ["تطوير الويب", "ذكاء اصطناعي", "حوسبة طرفية", "ويب أسمبلي"],
  },
  {
    slug: "mastering-ui-design-principles",
    titleEn: "Mastering UI Design Principles",
    titleAr: "إتقان مبادئ تصميم واجهة المستخدم",
    excerptEn: "A deep dive into the core principles that make user interfaces intuitive, beautiful, and effective.",
    excerptAr: "نظرة معمقة في المبادئ الأساسية التي تجعل واجهات المستخدم بديهية وجميلة وفعالة.",
    image: "https://picsum.photos/seed/blog2/1920/1080",
    authorEn: "Ahmed Hassan",
    authorAr: "أحمد حسن",
    authorRoleEn: "Lead Designer",
    authorRoleAr: "مصمم رئيسي",
    authorAvatar: "https://picsum.photos/seed/author2/96/96",
    authorBioEn: "Ahmed is a lead product designer who has shaped digital experiences for Fortune 500 companies. His work focuses on creating interfaces that balance aesthetics with usability.",
    authorBioAr: "أحمد مصمم منتجات رئيسي شكّل التجارب الرقمية لشركات فورتشن 500. يركز عمله على إنشاء واجهات توازن بين الجماليات وسهولة الاستخدام.",
    date: "2025-11-28",
    readTime: 6,
    categoryEn: "Design",
    categoryAr: "تصميم",
    headingsEn: ["Visual Hierarchy Matters", "Consistency Builds Trust", "Micro-interactions & Delight", "Accessibility is a Principle"],
    headingsAr: ["التسلسل البصري مهم", "الاتساق يبني الثقة", "التفاعلات الدقيقة والبهجة", "إمكانية الوصول مبدأ أساسي"],
    contentEn: [
      "Great UI design is not about decoration; it is about communication. Every pixel, every spacing decision, and every color choice should serve the user's goal. The best interfaces disappear, letting content and functionality take center stage. When users do not notice the design, it means the design is doing its job perfectly.",
      "Visual hierarchy is perhaps the most important principle in UI design. By carefully controlling size, color, contrast, and spacing, designers guide the user's eye through the interface in a deliberate sequence. A strong hierarchy reduces cognitive load and helps users find what they need without thinking.",
      "Consistency builds trust and reduces the learning curve. When buttons, icons, and interactions behave the same way throughout an application, users develop mental models that help them navigate with confidence. Design systems and component libraries have become essential tools for maintaining this consistency at scale.",
      "Micro-interactions breathe life into an interface. A subtle hover effect, a smooth transition, or a satisfying button press can transform a functional interface into a delightful experience. These small moments of delight accumulate, creating an emotional connection between the user and the product.",
      "Accessibility is not an afterthought; it is a design principle. When we design for the widest possible audience, including those with disabilities, we create better experiences for everyone. Color contrast, keyboard navigation, and screen reader support are not constraints but opportunities to improve."
    ],
    contentAr: [
      "تصميم واجهة المستخدم الرائع لا يتعلق بالتزيين، بل يتعلق بالتواصل. كل بكسل وكل قرار تباعد وكل اختيار لون يجب أن يخدم هدف المستخدم. أفضل الواجهات تختفي، تاركة المحتوى والوظائف في مركز الاهتمام.",
      "التسلسل البصري هو ربما أهم مبدأ في تصميم واجهة المستخدم. من خلال التحكم الدقيق في الحجم واللون والتباين والتباعد، يوجه المصممون عين المستخدم عبر الواجهة في تسلسل مدروس.",
      "الاتساق يبني الثقة ويقلل منحنى التعلم. عندما تتصرف الأزرار والأيقونات والتفاعلات بنفس الطريقة في جميع أنحاء التطبيق، يطور المستخدمون نماذج ذهنية تساعدهم على التنقل بثقة.",
      "التفاعلات الدقيقة تبث الحياة في الواجهة. تأثير تمرير خفي أو انتقال سلس أو ضغطة زر مرضية يمكن أن تحول واجهة وظيفية إلى تجربة ممتعة.",
      "إمكانية الوصول ليست فكرة لاحقة؛ إنها مبدأ تصميم. عندما نصمم لأوسع جمهور ممكن، بما في ذلك ذوي الإعاقة، نخلق تجارب أفضل للجميع."
    ],
    tagsEn: ["UI Design", "UX", "Design Systems"],
    tagsAr: ["تصميم واجهات", "تجربة المستخدم", "أنظمة التصميم"],
  },
  {
    slug: "building-scalable-apis",
    titleEn: "Building Scalable APIs with Node.js",
    titleAr: "بناء واجهات برمجة تطبيقات قابلة للتوسع مع Node.js",
    excerptEn: "Best practices for designing and building APIs that can handle millions of requests with reliability.",
    excerptAr: "أفضل الممارسات لتصميم وبناء واجهات برمجة تطبيقات قادرة على التعامل مع ملايين الطلبات بموثوقية.",
    image: "https://picsum.photos/seed/blog3/1920/1080",
    authorEn: "James Walker",
    authorAr: "جيمس ووكر",
    authorRoleEn: "Backend Engineer",
    authorRoleAr: "مهندس خلفي",
    authorAvatar: "https://picsum.photos/seed/author3/96/96",
    authorBioEn: "James is a backend engineer specializing in distributed systems and API architecture. He has built systems processing billions of requests and loves sharing his knowledge.",
    authorBioAr: "جيمس مهندس خلفي متخصص في الأنظمة الموزعة وهندسة واجهات البرمجة. بنى أنظمة تعالج مليارات الطلبات ويحب مشاركة معرفته.",
    date: "2025-11-10",
    readTime: 10,
    categoryEn: "Engineering",
    categoryAr: "هندسة",
    headingsEn: ["Caching & Rate Limiting", "Database Optimization", "Observability at Scale", "Horizontal Scaling"],
    headingsAr: ["التخزين المؤقت وتحديد المعدل", "تحسين قاعدة البيانات", "قابلية المراقبة على نطاق واسع", "التوسع الأفقي"],
    contentEn: [
      "Scalability is not something you bolt on after launch; it must be baked into every layer of your API from day one. From database schema design to request handling patterns, each decision you make in the early stages has compounding effects as your traffic grows.",
      "Rate limiting and caching are your first lines of defense against traffic spikes. A well-implemented caching strategy with Redis can reduce database load by up to 90%, while intelligent rate limiting protects your service from abuse without impacting legitimate users.",
      "Database optimization is where many APIs hit their scaling ceiling. Proper indexing, query optimization, connection pooling, and read replicas can dramatically improve throughput. Understanding your data access patterns and designing your schema accordingly is one of the highest-leverage activities.",
      "Observability is essential for operating APIs at scale. Structured logging, distributed tracing, and real-time metrics give you the visibility needed to diagnose issues before they impact users. Tools like Prometheus and Grafana have made comprehensive monitoring accessible to teams of any size.",
      "Horizontal scaling through containerization and orchestration with Kubernetes allows your API to grow elastically with demand. Combined with CI/CD pipelines and infrastructure as code, you can deploy with confidence and roll back instantly if issues arise."
    ],
    contentAr: [
      "القابلية للتوسع ليست شيئًا تضيفه بعد الإطلاق؛ يجب أن تكون مدمجة في كل طبقة من واجهة برمجة التطبيقات منذ اليوم الأول.",
      "تحديد المعدل والتخزين المؤقت هما خط دفاعك الأول ضد ارتفاعات حركة المرور. استراتيجية تخزين مؤقت جيدة التنفيذ مع Redis يمكن أن تقلل حمل قاعدة البيانات بنسبة تصل إلى 90%.",
      "تحسين قاعدة البيانات هو المكان الذي تصل فيه العديد من واجهات برمجة التطبيقات إلى سقف التوسع. الفهرسة المناسبة وتحسين الاستعلامات وتجميع الاتصالات يمكن أن تحسن الإنتاجية بشكل كبير.",
      "قابلية المراقبة ضرورية لتشغيل واجهات برمجة التطبيقات على نطاق واسع. التسجيل المنظم والتتبع الموزع والمقاييس في الوقت الفعلي تمنحك الرؤية اللازمة لتشخيص المشكلات.",
      "التوسع الأفقي من خلال الحاويات والتنسيق مع Kubernetes يسمح لواجهة برمجة التطبيقات بالنمو بمرونة مع الطلب."
    ],
    tagsEn: ["Node.js", "APIs", "Scalability", "Backend"],
    tagsAr: ["نود جي إس", "واجهات برمجية", "قابلية التوسع", "خلفية"],
  },
  {
    slug: "react-performance-optimization",
    titleEn: "React Performance Optimization Guide",
    titleAr: "دليل تحسين أداء React",
    excerptEn: "Practical techniques to make your React applications blazing fast with minimal effort.",
    excerptAr: "تقنيات عملية لجعل تطبيقات React سريعة للغاية بأقل جهد.",
    image: "https://picsum.photos/seed/blog4/1920/1080",
    authorEn: "Sarah Mitchell",
    authorAr: "سارة ميتشل",
    authorRoleEn: "Senior Developer",
    authorRoleAr: "مطورة أولى",
    authorAvatar: "https://picsum.photos/seed/author1/96/96",
    authorBioEn: "Sarah is a senior full-stack developer with over 10 years of experience building scalable web applications.",
    authorBioAr: "سارة مطورة أولى متكاملة مع أكثر من 10 سنوات من الخبرة في بناء تطبيقات ويب قابلة للتوسع.",
    date: "2025-10-22",
    readTime: 7,
    categoryEn: "Technology",
    categoryAr: "تكنولوجيا",
    headingsEn: ["Memoization Done Right", "Code Splitting & Lazy Loading", "State Architecture", "Quick Wins"],
    headingsAr: ["التخزين المؤقت بالطريقة الصحيحة", "تقسيم الكود والتحميل الكسول", "هندسة الحالة", "مكاسب سريعة"],
    contentEn: [
      "Performance is a feature, and in the world of React, it requires intentional effort. While React's virtual DOM provides a solid foundation, poorly structured components and unoptimized state management can lead to sluggish user experiences.",
      "Memoization with React.memo, useMemo, and useCallback is your primary tool for preventing unnecessary re-renders. However, premature optimization can add complexity without measurable benefit. Always profile first, identify the actual bottlenecks, and then apply targeted optimizations.",
      "Code splitting and lazy loading dramatically reduce initial bundle size. By loading components only when they are needed, you can cut your initial page load time significantly. React.lazy combined with Suspense boundaries creates a seamless loading experience.",
      "State management architecture has a profound impact on performance. Lifting state too high causes cascading re-renders, while keeping it too local leads to prop drilling. Modern patterns like Zustand and Jotai offer granular control over which parts of your UI re-render.",
      "Image optimization, virtualized lists, and debounced inputs are practical techniques that yield immediate performance gains. Libraries like react-window for long lists and next/image for automatic image optimization can transform the feel of your application."
    ],
    contentAr: [
      "الأداء هو ميزة، وفي عالم React، يتطلب جهدًا مقصودًا. بينما يوفر DOM الافتراضي لـ React أساسًا متينًا، يمكن أن تؤدي المكونات سيئة الهيكلة إلى تجارب بطيئة.",
      "التخزين المؤقت باستخدام React.memo و useMemo و useCallback هو أداتك الأساسية لمنع إعادة العرض غير الضرورية. ومع ذلك، يمكن أن يضيف التحسين المبكر تعقيدًا دون فائدة قابلة للقياس.",
      "تقسيم الكود والتحميل الكسول يقللان بشكل كبير حجم الحزمة الأولية. من خلال تحميل المكونات فقط عند الحاجة إليها، يمكنك تقليل وقت تحميل الصفحة.",
      "هندسة إدارة الحالة لها تأثير عميق على الأداء. رفع الحالة عاليًا جدًا يسبب إعادة عرض متتالية، بينما الاحتفاظ بها محليًا جدًا يؤدي إلى تمرير الخصائص.",
      "تحسين الصور والقوائم الافتراضية والمدخلات المؤجلة هي تقنيات عملية تحقق مكاسب أداء فورية."
    ],
    tagsEn: ["React", "Performance", "Frontend"],
    tagsAr: ["رياكت", "أداء", "واجهة أمامية"],
  },
  {
    slug: "mobile-first-design-strategy",
    titleEn: "Mobile-First Design Strategy",
    titleAr: "استراتيجية التصميم للهاتف أولاً",
    excerptEn: "Why starting with mobile design leads to better experiences across all devices and screen sizes.",
    excerptAr: "لماذا البدء بتصميم الهاتف يؤدي إلى تجارب أفضل عبر جميع الأجهزة.",
    image: "https://picsum.photos/seed/blog5/1920/1080",
    authorEn: "Layla Mansour",
    authorAr: "ليلى منصور",
    authorRoleEn: "UX Researcher",
    authorRoleAr: "باحثة تجربة المستخدم",
    authorAvatar: "https://picsum.photos/seed/author4/96/96",
    authorBioEn: "Layla is a UX researcher focused on human-centered design. She has conducted extensive research across mobile, web, and emerging platforms.",
    authorBioAr: "ليلى باحثة تجربة مستخدم تركز على التصميم المتمحور حول الإنسان. أجرت أبحاثًا مكثفة عبر منصات الجوال والويب.",
    date: "2025-10-05",
    readTime: 5,
    categoryEn: "Design",
    categoryAr: "تصميم",
    headingsEn: ["Constraints Drive Innovation", "Progressive Enhancement", "Performance First", "User Behavior on Mobile"],
    headingsAr: ["القيود تدفع الابتكار", "التحسين التدريجي", "الأداء أولاً", "سلوك المستخدم على الجوال"],
    contentEn: [
      "Mobile-first design is not just a responsive technique; it is a philosophy that fundamentally changes how you approach product design. By starting with the smallest screen, you are forced to prioritize ruthlessly.",
      "The constraints of mobile push designers to innovate. Limited screen real estate demands creative solutions for navigation, content hierarchy, and interaction patterns. Touch targets must be generous and typography must be legible.",
      "Progressive enhancement builds from the mobile foundation upward, adding complexity and visual richness as screen size increases. This approach ensures that the core experience works everywhere.",
      "Performance on mobile networks is non-negotiable. Mobile-first thinking naturally leads to lighter pages, optimized images, and efficient code delivery.",
      "User behavior on mobile is fundamentally different from desktop. Sessions are shorter, attention is divided, and context is variable. A mobile-first strategy accounts for these realities."
    ],
    contentAr: [
      "تصميم الهاتف أولاً ليس مجرد تقنية استجابة؛ إنه فلسفة تغير جذريًا كيفية التعامل مع تصميم المنتج.",
      "قيود الهاتف تدفع المصممين للابتكار. مساحة الشاشة المحدودة تتطلب حلولاً إبداعية للتنقل والتسلسل الهرمي للمحتوى.",
      "التحسين التدريجي يبني من أساس الهاتف صعودًا، مضيفًا التعقيد والثراء البصري مع زيادة حجم الشاشة.",
      "الأداء على شبكات الهاتف غير قابل للتفاوض. التفكير بالهاتف أولاً يؤدي طبيعيًا إلى صفحات أخف وصور محسنة.",
      "سلوك المستخدم على الهاتف مختلف جذريًا عن سطح المكتب. الجلسات أقصر والانتباه منقسم والسياق متغير."
    ],
    tagsEn: ["Mobile Design", "UX", "Responsive"],
    tagsAr: ["تصميم الهاتف", "تجربة المستخدم", "تصميم متجاوب"],
  },
  {
    slug: "cybersecurity-best-practices",
    titleEn: "Cybersecurity Best Practices for Startups",
    titleAr: "أفضل ممارسات الأمن السيبراني للشركات الناشئة",
    excerptEn: "Essential security measures every startup should implement from day one.",
    excerptAr: "إجراءات أمنية أساسية يجب على كل شركة ناشئة تنفيذها من اليوم الأول.",
    image: "https://picsum.photos/seed/blog6/1920/1080",
    authorEn: "Omar Khalil",
    authorAr: "عمر خليل",
    authorRoleEn: "Security Consultant",
    authorRoleAr: "مستشار أمني",
    authorAvatar: "https://picsum.photos/seed/author5/96/96",
    authorBioEn: "Omar is a cybersecurity consultant who has helped dozens of startups build robust security foundations.",
    authorBioAr: "عمر مستشار أمن سيبراني ساعد عشرات الشركات الناشئة في بناء أسس أمنية قوية.",
    date: "2025-09-18",
    readTime: 9,
    categoryEn: "Security",
    categoryAr: "أمن",
    headingsEn: ["Authentication First", "Encryption Everywhere", "Automated Security Testing", "Security Culture"],
    headingsAr: ["المصادقة أولاً", "التشفير في كل مكان", "اختبار الأمان الآلي", "ثقافة الأمان"],
    contentEn: [
      "Startups often treat security as a luxury they cannot yet afford, but the cost of a breach far outweighs the investment in basic protections. A single incident can destroy user trust and sink a young company.",
      "Authentication is your first line of defense. Implementing multi-factor authentication, secure password hashing with bcrypt or Argon2, and session management best practices are table stakes for any modern application.",
      "Data encryption at rest and in transit is non-negotiable. TLS for all network communication, encrypted database fields for sensitive data, and proper key management form the foundation of data protection.",
      "Regular security audits and penetration testing reveal vulnerabilities before attackers do. Automated scanning tools should be integrated into your CI/CD pipeline to ensure security testing happens consistently.",
      "Building a security-conscious culture is as important as technical measures. Every team member should understand phishing, social engineering, and secure coding practices."
    ],
    contentAr: [
      "غالبًا ما تتعامل الشركات الناشئة مع الأمن كرفاهية لا يمكنها تحملها بعد، لكن تكلفة الاختراق تفوق بكثير الاستثمار في الحماية الأساسية.",
      "المصادقة هي خط دفاعك الأول. تنفيذ المصادقة متعددة العوامل وتجزئة كلمات المرور الآمنة هي الحد الأدنى لأي تطبيق حديث.",
      "تشفير البيانات في حالة السكون والنقل غير قابل للتفاوض. TLS لجميع الاتصالات الشبكية وحقول قاعدة البيانات المشفرة تشكل أساس حماية البيانات.",
      "عمليات التدقيق الأمني المنتظمة واختبار الاختراق تكشف الثغرات قبل المهاجمين.",
      "بناء ثقافة واعية بالأمن لا يقل أهمية عن التدابير التقنية."
    ],
    tagsEn: ["Cybersecurity", "Startups", "Best Practices"],
    tagsAr: ["أمن سيبراني", "شركات ناشئة", "أفضل الممارسات"],
  },
  {
    slug: "power-of-design-systems",
    titleEn: "The Power of Design Systems",
    titleAr: "قوة أنظمة التصميم",
    excerptEn: "How design systems streamline development, ensure consistency, and scale your brand.",
    excerptAr: "كيف تعمل أنظمة التصميم على تبسيط التطوير وضمان الاتساق وتوسيع علامتك التجارية.",
    image: "https://picsum.photos/seed/blog7/1920/1080",
    authorEn: "Ahmed Hassan",
    authorAr: "أحمد حسن",
    authorRoleEn: "Lead Designer",
    authorRoleAr: "مصمم رئيسي",
    authorAvatar: "https://picsum.photos/seed/author2/96/96",
    authorBioEn: "Ahmed is a lead product designer who has shaped digital experiences for Fortune 500 companies.",
    authorBioAr: "أحمد مصمم منتجات رئيسي شكّل التجارب الرقمية لشركات فورتشن 500.",
    date: "2025-09-01",
    readTime: 6,
    categoryEn: "Design",
    categoryAr: "تصميم",
    headingsEn: ["Design Tokens", "Component Architecture", "Documentation", "ROI Over Time"],
    headingsAr: ["رموز التصميم", "هندسة المكونات", "التوثيق", "العائد على الاستثمار"],
    contentEn: [
      "A design system is more than a component library; it is a shared language between designers and developers that accelerates product development.",
      "Design tokens form the atomic foundation of any system. Colors, spacing, typography, and motion values defined as tokens can be consumed by any platform.",
      "Component architecture should balance flexibility with consistency. Well-designed components expose clear APIs that allow customization within guardrails.",
      "Documentation is what separates a living design system from an abandoned Figma file. Usage guidelines and code examples make the system approachable.",
      "The ROI of a design system compounds over time. Faster feature development, fewer inconsistencies, and easier onboarding are just the beginning."
    ],
    contentAr: [
      "نظام التصميم أكثر من مجرد مكتبة مكونات؛ إنه لغة مشتركة بين المصممين والمطورين تسرّع تطوير المنتج.",
      "رموز التصميم تشكل الأساس الذري لأي نظام. الألوان والتباعد والطباعة وقيم الحركة يمكن استهلاكها من أي منصة.",
      "هندسة المكونات يجب أن توازن بين المرونة والاتساق. المكونات المصممة جيدًا تكشف عن واجهات برمجة واضحة.",
      "التوثيق هو ما يفصل نظام تصميم حي عن ملف Figma مهجور.",
      "عائد الاستثمار لنظام التصميم يتراكم مع مرور الوقت."
    ],
    tagsEn: ["Design Systems", "Components", "Branding"],
    tagsAr: ["أنظمة التصميم", "مكونات", "علامة تجارية"],
  },
  {
    slug: "devops-continuous-deployment",
    titleEn: "DevOps and Continuous Deployment",
    titleAr: "DevOps والنشر المستمر",
    excerptEn: "Implementing CI/CD pipelines that enable rapid, reliable software delivery.",
    excerptAr: "تنفيذ خطوط أنابيب CI/CD التي تمكّن تسليم البرمجيات بسرعة وموثوقية.",
    image: "https://picsum.photos/seed/blog8/1920/1080",
    authorEn: "James Walker",
    authorAr: "جيمس ووكر",
    authorRoleEn: "Backend Engineer",
    authorRoleAr: "مهندس خلفي",
    authorAvatar: "https://picsum.photos/seed/author3/96/96",
    authorBioEn: "James is a backend engineer specializing in distributed systems and API architecture.",
    authorBioAr: "جيمس مهندس خلفي متخصص في الأنظمة الموزعة وهندسة واجهات البرمجة.",
    date: "2025-08-14",
    readTime: 8,
    categoryEn: "Engineering",
    categoryAr: "هندسة",
    headingsEn: ["Automated Testing", "Infrastructure as Code", "Monitoring & Observability", "Cultural Shift"],
    headingsAr: ["الاختبار الآلي", "البنية التحتية ككود", "المراقبة وقابلية الملاحظة", "التحول الثقافي"],
    contentEn: [
      "Continuous deployment is the natural evolution of agile development, taking the principle of delivering value frequently to its logical conclusion.",
      "A robust CI/CD pipeline begins with automated testing at every level: unit tests, integration tests, and end-to-end tests. Test coverage is the safety net that enables confident deployments.",
      "Infrastructure as code with tools like Terraform ensures that environments are reproducible and version-controlled. Combined with Docker, your deployment becomes deterministic.",
      "Monitoring and observability close the feedback loop. Real-time dashboards, automated alerts, and canary deployments allow teams to detect and respond to issues within minutes.",
      "The cultural shift toward DevOps is as important as the tooling. Breaking down silos between development and operations creates an environment where continuous deployment thrives."
    ],
    contentAr: [
      "النشر المستمر هو التطور الطبيعي للتطوير الرشيق، يأخذ مبدأ تقديم القيمة بشكل متكرر إلى نتيجته المنطقية.",
      "خط أنابيب CI/CD قوي يبدأ باختبار آلي على كل مستوى: اختبارات الوحدة واختبارات التكامل والاختبارات الشاملة.",
      "البنية التحتية ككود مع أدوات مثل Terraform تضمن أن البيئات قابلة للاستنساخ ومتحكم فيها بالإصدارات.",
      "المراقبة وقابلية الملاحظة تغلق حلقة التغذية الراجعة. لوحات المعلومات في الوقت الفعلي والتنبيهات الآلية تسمح بالاستجابة السريعة.",
      "التحول الثقافي نحو DevOps لا يقل أهمية عن الأدوات."
    ],
    tagsEn: ["DevOps", "CI/CD", "Automation"],
    tagsAr: ["ديف أوبس", "تكامل مستمر", "أتمتة"],
  },
  {
    slug: "ai-transforming-business",
    titleEn: "How AI is Transforming Business Operations",
    titleAr: "كيف يحول الذكاء الاصطناعي عمليات الأعمال",
    excerptEn: "Real-world examples of AI driving efficiency and innovation across industries.",
    excerptAr: "أمثلة واقعية على الذكاء الاصطناعي الذي يدفع الكفاءة والابتكار عبر الصناعات.",
    image: "https://picsum.photos/seed/blog9/1920/1080",
    authorEn: "Layla Mansour",
    authorAr: "ليلى منصور",
    authorRoleEn: "UX Researcher",
    authorRoleAr: "باحثة تجربة المستخدم",
    authorAvatar: "https://picsum.photos/seed/author4/96/96",
    authorBioEn: "Layla is a UX researcher focused on human-centered design and the intersection of AI with user experience.",
    authorBioAr: "ليلى باحثة تجربة مستخدم تركز على التصميم المتمحور حول الإنسان وتقاطع الذكاء الاصطناعي مع تجربة المستخدم.",
    date: "2025-07-30",
    readTime: 7,
    categoryEn: "Technology",
    categoryAr: "تكنولوجيا",
    headingsEn: ["Customer Experience", "Supply Chain Optimization", "AI-Driven Analytics", "Ethical Considerations"],
    headingsAr: ["تجربة العملاء", "تحسين سلسلة التوريد", "التحليلات المدفوعة بالذكاء الاصطناعي", "الاعتبارات الأخلاقية"],
    contentEn: [
      "Artificial intelligence has moved beyond the hype cycle and into the operational core of businesses worldwide. Organizations that treat AI as a tool that augments human decision-making are the ones winning.",
      "Customer experience is one of the most impactful areas for AI adoption. Chatbots handle routine inquiries, recommendation engines drive personalized experiences, and sentiment analysis provides real-time brand feedback.",
      "Supply chain optimization through AI-powered demand forecasting has become essential. Machine learning models analyze historical data, weather patterns, and social media trends to predict demand with remarkable accuracy.",
      "AI-driven analytics are transforming how businesses make decisions. Natural language processing allows executives to query data conversationally, while predictive models flag risks and opportunities early.",
      "The ethical considerations of AI in business cannot be overlooked. Bias in training data, transparency in automated decisions, and the impact on employment require thoughtful governance frameworks."
    ],
    contentAr: [
      "انتقل الذكاء الاصطناعي إلى ما بعد دورة الضجيج وإلى الجوهر التشغيلي للشركات في جميع أنحاء العالم.",
      "تجربة العملاء هي واحدة من أكثر المجالات تأثيرًا لتبني الذكاء الاصطناعي. روبوتات الدردشة تتعامل مع الاستفسارات ومحركات التوصية تقدم تجارب مخصصة.",
      "تحسين سلسلة التوريد من خلال التنبؤ بالطلب المدعوم بالذكاء الاصطناعي أصبح أساسيًا.",
      "التحليلات المدفوعة بالذكاء الاصطناعي تحول كيفية اتخاذ الشركات للقرارات.",
      "الاعتبارات الأخلاقية للذكاء الاصطناعي في الأعمال لا يمكن تجاهلها."
    ],
    tagsEn: ["AI", "Business", "Innovation", "Machine Learning"],
    tagsAr: ["ذكاء اصطناعي", "أعمال", "ابتكار", "تعلم آلي"],
  },
];

/* ─────────────────────────── HELPERS ─────────────────────────── */

function formatDate(dateStr: string, isAr: boolean) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(isAr ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/* ─────────────────── ANIMATED PARAGRAPH ─────────────────────── */

function AnimatedBlock({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════ COMPONENT ════════════════════════ */

export function ArticleContent({ slug }: { slug: string }) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = useTranslations("blog");
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  const tx = (en: string, ar: string) => (isAr ? ar : en);

  /* find article */
  const article = articles.find((a) => a.slug === slug) ?? articles[0];
  const currentIndex = articles.indexOf(article);
  const prevArticle = articles[(currentIndex - 1 + articles.length) % articles.length];
  const nextArticle = articles[(currentIndex + 1) % articles.length];
  const relatedArticles = articles
    .filter((a) => a.slug !== article.slug && a.categoryEn === article.categoryEn)
    .slice(0, 3);
  if (relatedArticles.length < 3) {
    const more = articles.filter((a) => a.slug !== article.slug && !relatedArticles.includes(a)).slice(0, 3 - relatedArticles.length);
    relatedArticles.push(...more);
  }

  /* reading progress */
  const [progress, setProgress] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(128);
  const [copied, setCopied] = useState(false);
  const [activeHeading, setActiveHeading] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* Track active heading via IntersectionObserver */
  useEffect(() => {
    // Small delay to ensure headings are rendered
    const timer = setTimeout(() => {
      const els = document.querySelectorAll("[data-heading-index]");
      if (els.length === 0) return;

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              const idx = Number(entry.target.getAttribute("data-heading-index"));
              if (!isNaN(idx)) setActiveHeading(idx);
            }
          }
        },
        { rootMargin: "-80px 0px -60% 0px", threshold: 0.1 }
      );

      els.forEach((el) => observer.observe(el));
      return () => observer.disconnect();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const scrollToHeading = useCallback((index: number) => {
    const el = document.getElementById(`heading-${index}`);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }, []);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const handleLike = useCallback(() => {
    setLiked((prev) => !prev);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
  }, [liked]);

  /* refs */
  const relatedRef = useRef(null);
  const navRef = useRef(null);
  const relatedInView = useInView(relatedRef, { once: true, margin: "-60px" });
  const navInView = useInView(navRef, { once: true, margin: "-60px" });

  const content = isAr ? article.contentAr : article.contentEn;
  const tags = isAr ? article.tagsAr : article.tagsEn;
  const headings = isAr ? article.headingsAr : article.headingsEn;

  return (
    <>
      {/* ═══════ READING PROGRESS BAR ═══════ */}
      <div
        className="fixed top-0 left-0 z-[60] h-[3px]"
        style={{
          width: `${progress}%`,
          background: "var(--color-primary)",
          boxShadow: "0 0 12px rgba(var(--color-primary-rgb) / 0.6)",
          transition: "width 100ms linear",
        }}
      />

      {/* ═══════ 1. ARTICLE HERO ═══════ */}
      <section className="relative min-h-[80vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={article.image}
            alt={tx(article.titleEn, article.titleAr)}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.15) 100%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(135deg, rgba(var(--color-primary-rgb) / 0.2) 0%, transparent 50%)",
            }}
          />
          {/* Noise texture */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "4px 4px",
            }}
          />
        </div>

        <Container className="relative z-10 pb-16 md:pb-24 pt-40">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl"
          >
            {/* Category + Reading info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex items-center gap-3 flex-wrap mb-6"
            >
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[11px] font-bold tracking-wider uppercase"
                style={{
                  background: "rgba(var(--color-primary-rgb) / 0.25)",
                  color: "var(--color-primary)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(var(--color-primary-rgb) / 0.35)",
                }}
              >
                <Sparkles className="h-3 w-3" />
                {tx(article.categoryEn, article.categoryAr)}
              </span>
              <span className="flex items-center gap-1.5 text-[13px]" style={{ color: "rgba(255,255,255,0.6)" }}>
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(article.date, isAr)}
              </span>
              <span className="flex items-center gap-1.5 text-[13px]" style={{ color: "rgba(255,255,255,0.6)" }}>
                <Clock className="h-3.5 w-3.5" />
                {article.readTime} {t("readTime")}
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-bold leading-[1.1] mb-8"
              style={{ color: "#ffffff" }}
            >
              {tx(article.titleEn, article.titleAr)}
            </motion.h1>

            {/* Author */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex items-center gap-4"
            >
              <div
                className="relative w-12 h-12 rounded-full overflow-hidden"
                style={{
                  border: "2px solid rgba(var(--color-primary-rgb) / 0.5)",
                  boxShadow: "0 0 20px rgba(var(--color-primary-rgb) / 0.2)",
                }}
              >
                <Image
                  src={article.authorAvatar}
                  alt={tx(article.authorEn, article.authorAr)}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "#ffffff" }}>
                  {tx(article.authorEn, article.authorAr)}
                </p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {tx(article.authorRoleEn, article.authorRoleAr)}
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              <ChevronDown className="h-5 w-5" />
            </motion.div>
          </motion.div>
        </Container>
      </section>

      {/* ═══════ 2. STICKY META BAR ═══════ */}
      <div
        className="sticky top-0 z-40"
        style={{
          background: "rgba(var(--color-background-rgb, 255 255 255) / 0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(var(--color-primary-rgb) / 0.06)",
        }}
      >
        <Container>
          <div className="flex items-center justify-between py-2.5">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs font-medium min-w-0">
              <Link
                href="/blog"
                className="shrink-0 transition-opacity duration-200 hover:opacity-100"
                style={{ color: "var(--color-primary)", opacity: 0.8 }}
              >
                {tx("Blog", "المدونة")}
              </Link>
              <span style={{ color: "rgba(var(--color-primary-rgb) / 0.25)" }}>/</span>
              <span className="shrink-0" style={{ color: "var(--color-foreground)", opacity: 0.4 }}>
                {tx(article.categoryEn, article.categoryAr)}
              </span>
              <span className="hidden sm:inline" style={{ color: "rgba(var(--color-primary-rgb) / 0.25)" }}>/</span>
              <span
                className="hidden sm:inline truncate"
                style={{ color: "var(--color-foreground)", opacity: 0.6 }}
              >
                {tx(article.titleEn, article.titleAr)}
              </span>
            </nav>

            {/* Share buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              {[
                { icon: <Twitter className="h-3.5 w-3.5" />, label: "Twitter", onClick: () => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`, "_blank") },
                { icon: <Linkedin className="h-3.5 w-3.5" />, label: "LinkedIn", onClick: () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`, "_blank") },
                { icon: copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />, label: "Copy", onClick: handleCopyLink },
              ].map((btn) => (
                <button
                  key={btn.label}
                  onClick={btn.onClick}
                  className="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer"
                  style={{
                    background: "rgba(var(--color-primary-rgb) / 0.06)",
                    border: "1px solid rgba(var(--color-primary-rgb) / 0.08)",
                    color: "var(--color-foreground)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(var(--color-primary-rgb) / 0.12)";
                    e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.2)";
                    e.currentTarget.style.color = "var(--color-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(var(--color-primary-rgb) / 0.06)";
                    e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.08)";
                    e.currentTarget.style.color = "var(--color-foreground)";
                  }}
                  title={btn.label}
                >
                  {btn.icon}
                </button>
              ))}
            </div>
          </div>
        </Container>
      </div>

      {/* ═══════ 3. ARTICLE BODY WITH TABLE OF CONTENTS ═══════ */}
      <section style={{ paddingBlock: "var(--section-y)" }}>
        <Container size="lg">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-12 lg:gap-16">
            {/* Main content */}
            <div className="min-w-0">
              <article className="max-w-[720px]">
                {/* First paragraph — drop cap style */}
                <AnimatedBlock>
                  <p
                    className="text-lg md:text-xl leading-[1.9] first-letter:text-[3.5rem] first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:leading-[0.8]"
                    style={{ color: "var(--color-foreground)", opacity: 0.85 }}
                  >
                    <span style={{ color: "var(--color-primary)" }}>{content[0]?.charAt(0)}</span>
                    {content[0]?.slice(1)}
                  </p>
                </AnimatedBlock>

                {/* Content sections with headings */}
                {content.slice(1).map((paragraph, i) => (
                  <div key={i} className="mt-12">
                    {/* Section heading */}
                    {headings[i] && (
                      <AnimatedBlock delay={0.05}>
                        <div className="flex items-center gap-3 mb-5">
                          <div
                            className="h-8 w-1 rounded-full"
                            style={{ background: "var(--color-primary)" }}
                          />
                          <h2
                            id={`heading-${i}`}
                            data-heading-index={i}
                            className="text-xl md:text-2xl font-bold scroll-mt-28"
                            style={{ color: "var(--color-foreground)" }}
                          >
                            {headings[i]}
                          </h2>
                        </div>
                      </AnimatedBlock>
                    )}

                    {/* Paragraph */}
                    <AnimatedBlock delay={0.08}>
                      <p
                        className="text-base md:text-[17px] leading-[1.9]"
                        style={{ color: "var(--color-foreground)", opacity: 0.75 }}
                      >
                        {paragraph}
                      </p>
                    </AnimatedBlock>

                    {/* Pull quote after 2nd content section */}
                    {i === 1 && (
                      <AnimatedBlock delay={0.1}>
                        <blockquote
                          className="relative my-12 py-8 rounded-2xl overflow-hidden"
                          style={{
                            background: "rgba(var(--color-primary-rgb) / 0.04)",
                            border: "1px solid rgba(var(--color-primary-rgb) / 0.1)",
                          }}
                        >
                          <div
                            className="absolute top-0 bottom-0 w-1 rounded-full"
                            style={{
                              background: "var(--color-primary)",
                              [isAr ? "right" : "left"]: 0,
                            }}
                          />
                          <div className="px-8 md:px-10">
                            <Quote
                              className="h-8 w-8 mb-3"
                              style={{ color: "rgba(var(--color-primary-rgb) / 0.2)" }}
                            />
                            <p
                              className="text-lg md:text-xl font-medium leading-relaxed italic"
                              style={{ color: "var(--color-foreground)", opacity: 0.85 }}
                            >
                              {content[2]?.split(". ").slice(0, 2).join(". ") + "."}
                            </p>
                          </div>
                        </blockquote>
                      </AnimatedBlock>
                    )}

                    {/* Inline image after 3rd content section */}
                    {i === 2 && (
                      <AnimatedBlock delay={0.1}>
                        <div
                          className="relative my-12 rounded-2xl overflow-hidden aspect-[16/9]"
                          style={{
                            boxShadow: "0 16px 48px rgba(var(--color-primary-rgb) / 0.08)",
                            border: "1px solid rgba(var(--color-primary-rgb) / 0.08)",
                          }}
                        >
                          <Image
                            src={`https://picsum.photos/seed/${article.slug}-inline/1200/675`}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 720px"
                          />
                          {/* Subtle overlay */}
                          <div
                            className="absolute inset-0"
                            style={{
                              background: "linear-gradient(to top, rgba(var(--color-primary-rgb) / 0.05) 0%, transparent 30%)",
                            }}
                          />
                        </div>
                      </AnimatedBlock>
                    )}

                    {/* Key insight box after 1st content section */}
                    {i === 0 && (
                      <AnimatedBlock delay={0.1}>
                        <div
                          className="my-10 rounded-2xl p-6 flex items-start gap-4"
                          style={{
                            background: "rgba(var(--color-primary-rgb) / 0.04)",
                            border: "1px solid rgba(var(--color-primary-rgb) / 0.1)",
                          }}
                        >
                          <div
                            className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{
                              background: "rgba(var(--color-primary-rgb) / 0.1)",
                              color: "var(--color-primary)",
                            }}
                          >
                            <Zap className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold mb-1" style={{ color: "var(--color-primary)" }}>
                              {tx("Key Insight", "ملاحظة رئيسية")}
                            </p>
                            <p className="text-sm leading-relaxed" style={{ color: "var(--color-foreground)", opacity: 0.7 }}>
                              {paragraph.split(". ").slice(0, 1).join(". ") + "."}
                            </p>
                          </div>
                        </div>
                      </AnimatedBlock>
                    )}
                  </div>
                ))}

                {/* Tags */}
                <AnimatedBlock>
                  <div className="mt-14 pt-8 flex flex-wrap gap-2" style={{ borderTop: "1px solid rgba(var(--color-primary-rgb) / 0.08)" }}>
                    <Tag className="h-4 w-4 mt-1.5 shrink-0" style={{ color: "var(--color-primary)", opacity: 0.5 }} />
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-block rounded-full px-4 py-1.5 text-xs font-medium"
                        style={{
                          background: "rgba(var(--color-primary-rgb) / 0.06)",
                          color: "var(--color-primary)",
                          border: "1px solid rgba(var(--color-primary-rgb) / 0.1)",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </AnimatedBlock>
              </article>
            </div>

            {/* Sidebar — Table of Contents + Author Mini + Engagement */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-6 max-h-[calc(100vh-8rem)] overflow-y-auto">
                {/* Table of Contents */}
                <div
                  className="rounded-2xl p-5 overflow-hidden"
                  style={{
                    background: "var(--color-card)",
                    border: "1px solid rgba(var(--color-primary-rgb) / 0.08)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
                    <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-foreground)", opacity: 0.5 }}>
                      {tx("Table of Contents", "جدول المحتويات")}
                    </h4>
                  </div>
                  <nav className="space-y-1">
                    {headings.map((heading, i) => (
                      <button
                        key={i}
                        className="w-full text-start px-3 py-2 rounded-lg text-[13px] leading-snug cursor-pointer"
                        style={{
                          color: activeHeading === i ? "var(--color-primary)" : "var(--color-foreground)",
                          opacity: activeHeading === i ? 1 : 0.5,
                          background: activeHeading === i ? "rgba(var(--color-primary-rgb) / 0.06)" : "transparent",
                          fontWeight: activeHeading === i ? 600 : 400,
                          transition: "all 0.2s ease",
                        }}
                        onClick={() => scrollToHeading(i)}
                      >
                        {heading}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Author Mini Card */}
                <div
                  className="rounded-2xl p-5 text-center"
                  style={{
                    background: "var(--color-card)",
                    border: "1px solid rgba(var(--color-primary-rgb) / 0.08)",
                  }}
                >
                  <div
                    className="mx-auto w-14 h-14 rounded-full overflow-hidden mb-3"
                    style={{ border: "2px solid rgba(var(--color-primary-rgb) / 0.2)" }}
                  >
                    <Image
                      src={article.authorAvatar}
                      alt={tx(article.authorEn, article.authorAr)}
                      width={56}
                      height={56}
                      className="object-cover"
                    />
                  </div>
                  <p className="text-sm font-semibold">{tx(article.authorEn, article.authorAr)}</p>
                  <p className="text-[11px] mt-0.5 mb-3" style={{ color: "var(--color-foreground)", opacity: 0.5 }}>
                    {tx(article.authorRoleEn, article.authorRoleAr)}
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    {[Mail, Linkedin, Globe].map((Icon, idx) => (
                      <button
                        key={idx}
                        className="h-7 w-7 rounded-lg flex items-center justify-center cursor-pointer"
                        style={{
                          background: "rgba(var(--color-primary-rgb) / 0.06)",
                          border: "1px solid rgba(var(--color-primary-rgb) / 0.08)",
                          color: "var(--color-foreground)",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "var(--color-primary)";
                          e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.25)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "var(--color-foreground)";
                          e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.08)";
                        }}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Engagement */}
                <div
                  className="rounded-2xl p-5"
                  style={{
                    background: "var(--color-card)",
                    border: "1px solid rgba(var(--color-primary-rgb) / 0.08)",
                  }}
                >
                  <div className="space-y-3">
                    <button
                      onClick={handleLike}
                      className="w-full flex items-center justify-center gap-2 h-9 rounded-xl text-xs font-semibold cursor-pointer"
                      style={{
                        background: liked ? "var(--color-primary)" : "rgba(var(--color-primary-rgb) / 0.06)",
                        color: liked ? "#ffffff" : "var(--color-foreground)",
                        border: `1px solid rgba(var(--color-primary-rgb) / ${liked ? "1" : "0.1"})`,
                        transition: "all 0.3s ease",
                      }}
                    >
                      <Heart className="h-3.5 w-3.5" style={{ fill: liked ? "#ffffff" : "none" }} />
                      {likeCount} {tx("Likes", "إعجاب")}
                    </button>
                    <button
                      className="w-full flex items-center justify-center gap-2 h-9 rounded-xl text-xs font-semibold cursor-pointer"
                      style={{
                        background: "rgba(var(--color-primary-rgb) / 0.06)",
                        color: "var(--color-foreground)",
                        border: "1px solid rgba(var(--color-primary-rgb) / 0.1)",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.25)";
                        e.currentTarget.style.color = "var(--color-primary)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.1)";
                        e.currentTarget.style.color = "var(--color-foreground)";
                      }}
                    >
                      <Bookmark className="h-3.5 w-3.5" />
                      {tx("Save Article", "حفظ المقال")}
                    </button>
                    <button
                      onClick={handleCopyLink}
                      className="w-full flex items-center justify-center gap-2 h-9 rounded-xl text-xs font-semibold cursor-pointer"
                      style={{
                        background: "rgba(var(--color-primary-rgb) / 0.06)",
                        color: "var(--color-foreground)",
                        border: "1px solid rgba(var(--color-primary-rgb) / 0.1)",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.25)";
                        e.currentTarget.style.color = "var(--color-primary)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.1)";
                        e.currentTarget.style.color = "var(--color-foreground)";
                      }}
                    >
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
                      {copied ? tx("Copied!", "تم النسخ!") : tx("Share", "مشاركة")}
                    </button>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </Container>
      </section>

      <SectionDivider />

      {/* ═══════ 4. AUTHOR BIO (full-width for mobile, since sidebar handles desktop) ═══════ */}
      <section className="lg:hidden" style={{ paddingBlock: "var(--section-y)" }}>
        <Container size="sm">
          <AnimatedBlock>
            <div
              className="relative rounded-2xl p-6 overflow-hidden"
              style={{
                background: "var(--color-card)",
                border: "1px solid rgba(var(--color-primary-rgb) / 0.1)",
              }}
            >
              <div
                className="absolute top-0 inset-x-0 h-[2px]"
                style={{ background: "linear-gradient(90deg, transparent, var(--color-primary), transparent)" }}
              />
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="relative w-14 h-14 rounded-full overflow-hidden shrink-0"
                  style={{ border: "2px solid rgba(var(--color-primary-rgb) / 0.2)" }}
                >
                  <Image
                    src={article.authorAvatar}
                    alt={tx(article.authorEn, article.authorAr)}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-primary)" }}>
                    {tx("About the Author", "عن الكاتب")}
                  </p>
                  <p className="text-base font-bold">{tx(article.authorEn, article.authorAr)}</p>
                  <p className="text-xs" style={{ opacity: 0.5 }}>{tx(article.authorRoleEn, article.authorRoleAr)}</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed mb-4" style={{ opacity: 0.7 }}>
                {tx(article.authorBioEn, article.authorBioAr)}
              </p>
              <div className="flex items-center gap-2">
                {[Mail, Linkedin, Globe].map((Icon, idx) => (
                  <button
                    key={idx}
                    className="h-8 w-8 rounded-lg flex items-center justify-center cursor-pointer"
                    style={{
                      background: "rgba(var(--color-primary-rgb) / 0.06)",
                      border: "1px solid rgba(var(--color-primary-rgb) / 0.08)",
                      color: "var(--color-foreground)",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "var(--color-primary)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--color-foreground)";
                    }}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>
          </AnimatedBlock>

          {/* Mobile engagement */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={handleLike}
              className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium cursor-pointer"
              style={{
                background: liked ? "var(--color-primary)" : "rgba(var(--color-primary-rgb) / 0.06)",
                color: liked ? "#ffffff" : "var(--color-primary)",
                border: `1px solid rgba(var(--color-primary-rgb) / ${liked ? "1" : "0.12"})`,
                transition: "all 0.3s ease",
              }}
            >
              <Heart className="h-4 w-4" style={{ fill: liked ? "#ffffff" : "none" }} />
              {likeCount}
            </button>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium cursor-pointer"
              style={{
                background: "rgba(var(--color-primary-rgb) / 0.06)",
                color: "var(--color-foreground)",
                border: "1px solid rgba(var(--color-primary-rgb) / 0.1)",
              }}
            >
              {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
              {copied ? tx("Copied!", "تم النسخ!") : tx("Share", "مشاركة")}
            </button>
          </div>
        </Container>
      </section>

      {/* Mobile divider */}
      <div className="lg:hidden">
        <SectionDivider />
      </div>

      {/* ═══════ 5. RELATED ARTICLES ═══════ */}
      <section ref={relatedRef} style={{ paddingBlock: "var(--section-y)" }}>
        <Container>
          <div className="text-center mb-12">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={relatedInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: "var(--color-primary)" }}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              {tx("Keep Reading", "تابع القراءة")}
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              animate={relatedInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-2xl md:text-3xl font-bold"
            >
              {tx("Related Articles", "مقالات ذات صلة")}
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedArticles.map((related, i) => (
              <motion.div
                key={related.slug}
                initial={{ opacity: 0, y: 32 }}
                animate={relatedInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.15 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  href={`/blog/${related.slug}`}
                  className="group block rounded-2xl overflow-hidden h-full"
                  style={{
                    background: "var(--color-card)",
                    border: "1px solid rgba(var(--color-primary-rgb) / 0.08)",
                    transition: "border-color 0.4s ease, box-shadow 0.4s ease, transform 0.4s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.2)";
                    e.currentTarget.style.boxShadow = "0 16px 48px rgba(var(--color-primary-rgb) / 0.08)";
                    e.currentTarget.style.transform = "translateY(-4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.08)";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={related.image}
                      alt={tx(related.titleEn, related.titleAr)}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div
                      className="absolute inset-0"
                      style={{ background: "linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 50%)" }}
                    />
                    <span
                      className="absolute top-3 start-3 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        background: "rgba(var(--color-primary-rgb) / 0.2)",
                        color: "var(--color-primary)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid rgba(var(--color-primary-rgb) / 0.25)",
                      }}
                    >
                      {tx(related.categoryEn, related.categoryAr)}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="text-[15px] font-bold mb-2 leading-snug line-clamp-2">
                      {tx(related.titleEn, related.titleAr)}
                    </h3>
                    <p className="text-xs leading-relaxed line-clamp-2 mb-3" style={{ opacity: 0.55 }}>
                      {tx(related.excerptEn, related.excerptAr)}
                    </p>
                    <div className="flex items-center gap-3 text-[11px]" style={{ opacity: 0.4 }}>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(related.date, isAr)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {related.readTime} {t("readTime")}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      <SectionDivider />

      {/* ═══════ 6. NEXT/PREV NAV ═══════ */}
      <section ref={navRef} style={{ paddingBlock: "var(--section-y)" }}>
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { art: prevArticle, label: tx("Previous", "السابق"), isNext: false },
              { art: nextArticle, label: tx("Next", "التالي"), isNext: true },
            ].map((item, i) => (
              <motion.div
                key={item.art.slug + i}
                initial={{ opacity: 0, y: 24 }}
                animate={navInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  href={`/blog/${item.art.slug}`}
                  className="group flex items-center gap-4 rounded-2xl p-4 h-full"
                  style={{
                    background: "var(--color-card)",
                    border: "1px solid rgba(var(--color-primary-rgb) / 0.08)",
                    transition: "border-color 0.3s ease, box-shadow 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.2)";
                    e.currentTarget.style.boxShadow = "0 8px 32px rgba(var(--color-primary-rgb) / 0.06)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.08)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {/* Arrow left for prev */}
                  {!item.isNext && (
                    <div
                      className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center"
                      style={{
                        background: "rgba(var(--color-primary-rgb) / 0.06)",
                        border: "1px solid rgba(var(--color-primary-rgb) / 0.1)",
                        color: "var(--color-primary)",
                        transition: "all 0.3s ease",
                      }}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </div>
                  )}

                  {/* Image */}
                  <div
                    className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0"
                    style={{ border: "1px solid rgba(var(--color-primary-rgb) / 0.06)" }}
                  >
                    <Image
                      src={item.art.image}
                      alt={tx(item.art.titleEn, item.art.titleAr)}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      sizes="64px"
                    />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--color-primary)", opacity: 0.7 }}>
                      {item.label}
                    </p>
                    <p className="text-sm font-semibold leading-snug line-clamp-2">
                      {tx(item.art.titleEn, item.art.titleAr)}
                    </p>
                  </div>

                  {/* Arrow right for next */}
                  {item.isNext && (
                    <div
                      className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center"
                      style={{
                        background: "rgba(var(--color-primary-rgb) / 0.06)",
                        border: "1px solid rgba(var(--color-primary-rgb) / 0.1)",
                        color: "var(--color-primary)",
                        transition: "all 0.3s ease",
                      }}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}
                </Link>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* ═══════ 7. NEWSLETTER CTA ═══════ */}
      <section
        className="relative overflow-hidden"
        style={{
          paddingBlock: "var(--section-y)",
          background: "rgba(var(--color-primary-rgb) / 0.03)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 50% 0%, rgba(var(--color-primary-rgb) / 0.08) 0%, transparent 60%)",
          }}
        />
        <Container size="sm" className="relative z-10">
          <AnimatedBlock>
            <div
              className="rounded-2xl p-8 md:p-12 text-center overflow-hidden relative"
              style={{
                background: "var(--color-card)",
                border: "1px solid rgba(var(--color-primary-rgb) / 0.1)",
                boxShadow: "0 16px 48px rgba(var(--color-primary-rgb) / 0.06)",
              }}
            >
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-[2px] rounded-full"
                style={{ background: "var(--color-primary)" }}
              />

              <div
                className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5"
                style={{
                  background: "rgba(var(--color-primary-rgb) / 0.08)",
                  color: "var(--color-primary)",
                  border: "1px solid rgba(var(--color-primary-rgb) / 0.12)",
                }}
              >
                <Send className="h-6 w-6" />
              </div>

              <h3 className="text-xl md:text-2xl font-bold mb-2">
                {tx("Never Miss an Article", "لا تفوت أي مقال")}
              </h3>
              <p className="text-sm mb-6 max-w-md mx-auto" style={{ opacity: 0.5 }}>
                {tx(
                  "Get weekly insights on design, development, and technology delivered to your inbox.",
                  "احصل على رؤى أسبوعية حول التصميم والتطوير والتقنية مباشرة في بريدك."
                )}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder={tx("your@email.com", "بريدك@الإلكتروني.com")}
                  className="flex-1 rounded-xl px-4 py-3 text-sm outline-none"
                  style={{
                    background: "rgba(var(--color-primary-rgb) / 0.04)",
                    border: "1px solid rgba(var(--color-primary-rgb) / 0.1)",
                    color: "var(--color-foreground)",
                    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.3)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(var(--color-primary-rgb) / 0.06)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.1)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold cursor-pointer"
                  style={{
                    background: "var(--color-primary)",
                    color: "#ffffff",
                    boxShadow: "0 4px 16px rgba(var(--color-primary-rgb) / 0.25)",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(var(--color-primary-rgb) / 0.35)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(var(--color-primary-rgb) / 0.25)";
                  }}
                >
                  <Mail className="h-4 w-4" />
                  {tx("Subscribe", "اشترك")}
                </button>
              </div>
            </div>
          </AnimatedBlock>
        </Container>
      </section>

      <SectionDivider />
    </>
  );
}
