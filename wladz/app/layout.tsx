import type { Metadata, Viewport } from "next";
import { Baloo_Bhaijaan_2, Cairo } from "next/font/google";
import "./globals.css";
import "./ui.css";

// Police de la page d’accueil (components/landing).
const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  display: "swap",
});

const baloo = Baloo_Bhaijaan_2({
  variable: "--font-baloo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: { default: "WLADZ", template: "%s | WLADZ" },
  description: "منصة ألعاب تعليمية وتوعوية لأطفال وشباب الجزائر",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#9ed8ff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className={`${baloo.variable} ${cairo.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-sky-grad font-sans text-ink">
        {children}
      </body>
    </html>
  );
}
