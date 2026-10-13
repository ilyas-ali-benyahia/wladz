import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
});

export const metadata: Metadata = {
  title: { default: "WLADZ", template: "%s | WLADZ" },
  description: "منصة ألعاب تعليمية وتوعوية لأطفال وشباب الجزائر",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-linear-to-b from-sky-top to-sky-bottom font-sans text-ink">
        {children}
      </body>
    </html>
  );
}
