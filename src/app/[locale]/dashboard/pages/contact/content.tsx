"use client";

import { PageEditor } from "../../page-editor";
import { Mail } from "lucide-react";

export function ContactEditorContent() {
  return (
    <PageEditor
      pageKey="contact"
      pageTitleEn="Contact"
      pageTitleAr="تواصل معنا"
      pageIcon={<Mail className="h-5 w-5" />}
    />
  );
}
