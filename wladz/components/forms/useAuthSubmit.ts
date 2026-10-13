"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function useAuthSubmit(endpoint: "/api/auth/login" | "/api/auth/register") {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const { birthDay, birthMonth, birthYear, ...fields } = Object.fromEntries(
      new FormData(event.currentTarget),
    );
    const body = birthYear
      ? {
          ...fields,
          birthDate: `${birthYear}-${String(birthMonth).padStart(2, "0")}-${String(birthDay).padStart(2, "0")}`,
        }
      : fields;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        router.push("/dashboard");
        router.refresh();
        return;
      }

      const data: unknown = await response.json().catch(() => null);
      setError(
        typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof data.error === "string"
          ? data.error
          : "حدث خطأ صغير. حاول مرة أخرى!",
      );
    } catch {
      setError("تعذّر الاتصال. تحقّق من الإنترنت وحاول مرة أخرى!");
    }
    setPending(false);
  }

  return { error, pending, onSubmit };
}
