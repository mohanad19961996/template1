"use client";

import { PageEditor } from "../../page-editor";
import { GraduationCap } from "lucide-react";

export function CareersEditorContent() {
  return (
    <PageEditor
      pageKey="careers"
      pageTitleEn="Careers"
      pageTitleAr="الوظائف"
      pageIcon={<GraduationCap className="h-5 w-5" />}
    />
  );
}
