import type { Metadata } from "next";
import { Hand } from "lucide-react";
import { AuthScene } from "@/components/forms/AuthScene";
import { LoginForm } from "@/components/forms/LoginForm";
import { GuestOnly } from "@/components/navigation/GuestOnly";

export const metadata: Metadata = { title: "تسجيل الدخول" };

export default function LoginPage() {
  return (
    <AuthScene icon={Hand} tone="#e5a400" title="مرحباً بعودتك!" subtitle="سجّل دخولك لتواصل اللعب والتعلّم">
      <GuestOnly>
        <LoginForm />
      </GuestOnly>
    </AuthScene>
  );
}
