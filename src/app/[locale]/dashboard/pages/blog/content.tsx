"use client";

import { PageEditor } from "../../page-editor";
import { BookOpen } from "lucide-react";

export function BlogEditorContent() {
  return (
    <PageEditor
      pageKey="blog"
      pageTitleEn="Blog"
      pageTitleAr="المدونة"
      pageIcon={<BookOpen className="h-5 w-5" />}
    />
  );
}
