import type { Metadata } from "next";
import { Noto_Sans, Noto_Sans_Devanagari } from "next/font/google";
import "../globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getDictionary } from "@/lib/dictionary";
import { notFound } from "next/navigation";

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

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "en" && locale !== "ne") {
    return {};
  }
  const dict = await getDictionary(locale);
  return {
    title: "Krishi Mulya — Nepal Agriculture Price Intelligence",
    description: dict.footer.desc,
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params;
  
  if (locale !== "en" && locale !== "ne") {
    notFound();
  }

  const dict = await getDictionary(locale);

  return (
    <html
      lang={locale}
      className={`${notoSans.variable} ${notoDevanagari.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-leaf-50 text-soil-800">
        <Header locale={locale} dict={dict} />
        <main className="flex-1 flex flex-col pt-28 md:pt-20">{children}</main>
        <Footer locale={locale} dict={dict} />
      </body>
    </html>
  );
}
