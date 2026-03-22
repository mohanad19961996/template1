"use client";

import { PageEditor } from "../../page-editor";
import { FolderOpen } from "lucide-react";

export function PortfolioEditorContent() {
  return (
    <PageEditor
      pageKey="portfolio"
      pageTitleEn="Portfolio"
      pageTitleAr="أعمالنا"
      pageIcon={<FolderOpen className="h-5 w-5" />}
    />
  );
}
