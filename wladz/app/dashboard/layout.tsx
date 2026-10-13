import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/navigation/LogoutButton";
import { getSessionUser } from "@/lib/auth";

async function SignedIn({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <>
      <header className="flex items-center justify-between gap-3 bg-dz-white px-4 py-3 shadow-sm">
        <Link
          href="/dashboard/profile"
          className="flex min-h-11 items-center gap-2 text-lg font-extrabold text-ink"
        >
          <span
            aria-hidden="true"
            className="flex size-10 items-center justify-center rounded-full bg-dz-green text-dz-white"
          >
            {user.full_name[0]}
          </span>
          مرحباً، {user.full_name.split(" ")[0]}!
        </Link>
        <div className="flex items-center gap-3">
          <p className="rounded-full bg-dz-green-soft px-3 py-2 text-base font-bold text-ink">
            <span className="text-gold" aria-hidden="true">
              ★
            </span>{" "}
            {user.points} نقطة
          </p>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">{children}</main>
    </>
  );
}

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <Suspense
      fallback={<p className="p-8 text-center text-lg text-ink-soft">جارٍ التحميل…</p>}
    >
      <SignedIn>{children}</SignedIn>
    </Suspense>
  );
}
