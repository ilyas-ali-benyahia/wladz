import type { Metadata } from "next";
import { AuthScene } from "@/components/forms/AuthScene";
import { RegisterForm } from "@/components/forms/RegisterForm";
import { GuestOnly } from "@/components/navigation/GuestOnly";

export const metadata: Metadata = { title: "حساب جديد" };

export default function RegisterPage() {
  return (
    <AuthScene emoji="🌟" title="حساب جديد" subtitle="اطلب من أحد والديك أن يساعدك">
      <GuestOnly>
        <RegisterForm />
      </GuestOnly>
    </AuthScene>
  );
}
