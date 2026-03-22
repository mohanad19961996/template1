"use client";

import { PageEditor } from "../../page-editor";
import { ImageIcon } from "lucide-react";

export function GalleryEditorContent() {
  return (
    <PageEditor
      pageKey="gallery"
      pageTitleEn="Gallery"
      pageTitleAr="المعرض"
      pageIcon={<ImageIcon className="h-5 w-5" />}
    />
  );
}
