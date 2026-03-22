"use client";

import { PageEditor } from "../../page-editor";
import { Palette } from "lucide-react";

export function DesignerEditorContent() {
  return (
    <PageEditor
      pageKey="designer"
      pageTitleEn="Designer"
      pageTitleAr="المصمم"
      pageIcon={<Palette className="h-5 w-5" />}
    />
  );
}
