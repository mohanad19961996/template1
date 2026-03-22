"use client";

import { PageEditor } from "../../page-editor";
import { MessageSquare } from "lucide-react";

export function TestimonialsEditorContent() {
  return (
    <PageEditor
      pageKey="testimonials"
      pageTitleEn="Testimonials"
      pageTitleAr="آراء العملاء"
      pageIcon={<MessageSquare className="h-5 w-5" />}
    />
  );
}
