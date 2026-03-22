"use client";

import { PageEditor } from "../../page-editor";
import { Users } from "lucide-react";

export function TeamEditorContent() {
  return (
    <PageEditor
      pageKey="team"
      pageTitleEn="Team"
      pageTitleAr="الفريق"
      pageIcon={<Users className="h-5 w-5" />}
    />
  );
}
