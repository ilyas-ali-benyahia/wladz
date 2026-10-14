import type { Metadata } from "next";
import { AuthScene } from "@/components/forms/AuthScene";
import { LoginForm } from "@/components/forms/LoginForm";
import { GuestOnly } from "@/components/navigation/GuestOnly";

export const metadata: Metadata = { title: "تسجيل الدخول" };

export default function LoginPage() {
  return (
    <AuthScene emoji="👋" title="مرحباً بعودتك!" subtitle="سجّل دخولك لتواصل اللعب والتعلّم">
      <GuestOnly>
        <LoginForm />
      </GuestOnly>
    </AuthScene>
  );
}
