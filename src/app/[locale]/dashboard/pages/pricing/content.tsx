"use client";

import { PageEditor } from "../../page-editor";
import { CreditCard } from "lucide-react";

export function PricingEditorContent() {
  return (
    <PageEditor
      pageKey="pricing"
      pageTitleEn="Pricing"
      pageTitleAr="الأسعار"
      pageIcon={<CreditCard className="h-5 w-5" />}
    />
  );
}
