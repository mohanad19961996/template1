"use client";

import { PageEditor } from "../../page-editor";
import { Info } from "lucide-react";

export function AboutEditorContent() {
  return (
    <PageEditor
      pageKey="about"
      pageTitleEn="About"
      pageTitleAr="من نحن"
      pageIcon={<Info className="h-5 w-5" />}
    />
  );
}
