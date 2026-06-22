"use client";

import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { LoginPageContent } from "@/components/auth/LoginPageContent";

export default function LoginPage() {
  return (
    <AuthSplitLayout variant="login">
      <LoginPageContent />
    </AuthSplitLayout>
  );
}
