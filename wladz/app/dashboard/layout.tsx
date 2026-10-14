import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { Footer } from "@/components/navigation/Footer";
import { Sidebar } from "@/components/navigation/Sidebar";
import { getSessionUser } from "@/lib/auth";

async function SignedIn({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex flex-1">
        <Sidebar points={user.points} />
        <div className="min-w-0 flex-1 px-4 pt-24 pb-6 md:px-6 md:pt-8 lg:px-8">
          <main className="mx-auto w-full max-w-5xl">{children}</main>
        </div>
      </div>
      {/* Pied de page sur toute la largeur, sous la barre latérale. */}
      <Footer />
    </div>
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
