"use client";

import Link from "next/link";
import { Suspense } from "react";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { RegisterPageContent } from "@/components/auth/RegisterPageContent";

export default function RegisterPage() {
  return (
    <AuthSplitLayout variant="register">
      <Suspense
        fallback={
          <p className="text-center text-sm text-slate-500">Loading registration…</p>
        }
      >
        <RegisterPageContent />
      </Suspense>
    </AuthSplitLayout>
  );
}
