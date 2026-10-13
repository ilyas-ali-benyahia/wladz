"use client";

import Link from "next/link";
import { BirthDateField } from "@/components/forms/BirthDateField";
import { Field, FormError, SubmitButton } from "@/components/forms/Field";
import { useAuthSubmit } from "@/components/forms/useAuthSubmit";

export function RegisterForm() {
  const { error, pending, onSubmit } = useAuthSubmit("/api/auth/register");

  return (
    <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
      <Field
        label="الاسم الكامل"
        hint="ستكتبه في كل مرة لتدخل إلى حسابك."
        name="fullName"
        autoComplete="username"
        placeholder="مثال: أمين بن علي"
        maxLength={80}
      />
      <BirthDateField />
      <Field
        label="رقم هاتف الوليّ"
        name="parentPhone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="0X XX XX XX XX"
        dir="ltr"
        maxLength={20}
      />
      <Field
        label="كلمة السر"
        hint="12 حرفاً على الأقل. لا تخبر بها أحداً غير والديك."
        name="password"
        type="password"
        autoComplete="new-password"
        dir="ltr"
        minLength={12}
        maxLength={128}
      />
      <FormError message={error} />
      <SubmitButton pending={pending} label="إنشاء الحساب" />
      <p className="text-center text-base text-ink-soft">
        لديك حساب؟{" "}
        <Link
          href="/login"
          className="inline-block py-2 font-bold text-dz-green underline underline-offset-4"
        >
          سجّل دخولك
        </Link>
      </p>
    </form>
  );
}
