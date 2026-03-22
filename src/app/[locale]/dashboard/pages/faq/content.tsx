"use client";

import { PageEditor } from "../../page-editor";
import { HelpCircle } from "lucide-react";

export function FaqEditorContent() {
  return (
    <PageEditor
      pageKey="faq"
      pageTitleEn="FAQ"
      pageTitleAr="الأسئلة الشائعة"
      pageIcon={<HelpCircle className="h-5 w-5" />}
    />
  );
}
