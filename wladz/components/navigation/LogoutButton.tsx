"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      className="h-11 cursor-pointer rounded-2xl border-2 border-dz-green px-4 text-base font-bold text-dz-green transition hover:bg-dz-green-soft"
    >
      خروج
    </button>
  );
}
