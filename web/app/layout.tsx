import type { Metadata } from "next";
import { Noto_Sans, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

// Both fonts are loaded globally so mixed-script text (English + Nepali)
// renders correctly on every page. Noto Sans and Noto Sans Devanagari are
// designed as a matching pair (consistent weight/proportions).
const notoSans = Noto_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-devanagari",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Krishi Mulya — Nepal Agriculture Price Intelligence",
  description:
    "Daily and historical wholesale prices from Kalimati Market, Nepal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // lang="en" is a temporary default — Phase 6 moves pages under
    // app/[locale]/layout.tsx which sets lang={locale} dynamically.
    <html
      lang="en"
      className={`${notoSans.variable} ${notoDevanagari.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-leaf-50 text-soil-800">
        <Header />
        <main className="flex-1 flex flex-col pt-28 md:pt-20">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

