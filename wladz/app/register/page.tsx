import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { AuthScene } from "@/components/forms/AuthScene";
import { RegisterForm } from "@/components/forms/RegisterForm";
import { GuestOnly } from "@/components/navigation/GuestOnly";

export const metadata: Metadata = { title: "حساب جديد" };

export default function RegisterPage() {
  return (
    <AuthScene icon={Sparkles} tone="#2f8f5b" title="حساب جديد" subtitle="اطلب من أحد والديك أن يساعدك">
      <GuestOnly>
        <RegisterForm />
      </GuestOnly>
    </AuthScene>
  );
}
