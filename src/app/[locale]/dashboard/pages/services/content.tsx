"use client";

import { PageEditor } from "../../page-editor";
import { Briefcase } from "lucide-react";

export function ServicesEditorContent() {
  return (
    <PageEditor
      pageKey="services"
      pageTitleEn="Services"
      pageTitleAr="خدماتنا"
      pageIcon={<Briefcase className="h-5 w-5" />}
    />
  );
}
