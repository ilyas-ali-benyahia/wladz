import type { Metadata } from "next";
import { AuthScene } from "@/components/forms/AuthScene";
import { LoginForm } from "@/components/forms/LoginForm";

export const metadata: Metadata = { title: "تسجيل الدخول" };

export default function LoginPage() {
  return (
    <AuthScene emoji="👋" title="مرحباً بعودتك!" subtitle="سجّل دخولك لتواصل اللعب والتعلّم">
      <LoginForm />
    </AuthScene>
  );
}
