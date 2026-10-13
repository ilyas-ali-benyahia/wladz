"use client";

import Link from "next/link";
import { Field, FormError, SubmitButton } from "@/components/forms/Field";
import { useAuthSubmit } from "@/components/forms/useAuthSubmit";

export function LoginForm() {
  const { error, pending, onSubmit } = useAuthSubmit("/api/auth/login");

  return (
    <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
      <Field
        label="الاسم الكامل"
        name="fullName"
        autoComplete="username"
        placeholder="مثال: أمين بن علي"
        maxLength={80}
      />
      <Field
        label="كلمة السر"
        name="password"
        type="password"
        autoComplete="current-password"
        dir="ltr"
        maxLength={128}
      />
      <FormError message={error} />
      <SubmitButton pending={pending} label="دخول" />
      <p className="text-center text-base text-ink-soft">
        ليس لديك حساب؟{" "}
        <Link
          href="/register"
          className="inline-block py-2 font-bold text-dz-green underline underline-offset-4"
        >
          أنشئ حساباً جديداً
        </Link>
      </p>
    </form>
  );
}
