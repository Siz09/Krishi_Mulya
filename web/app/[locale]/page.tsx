import type { Metadata } from "next";
import CommodityListingPage from "@/components/commodity/CommodityListingPage";
import { getDictionary } from "@/lib/dictionary";
import { notFound } from "next/navigation";
import { getSeoMetadata } from "@/lib/seo";
import JsonLd from "@/components/shared/JsonLd";

export const revalidate = 1800; // revalidate every 30 minutes

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; market?: string; page?: string }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { locale } = await props.params;
  if (locale !== "en" && locale !== "ne") {
    return {};
  }
  const isNe = locale === "ne";
  const title = isNe
    ? "आजको कालीमाटी बजार मूल्य — कृषि मूल्य"
    : "Today's Kalimati Market Prices — Krishi Mulya";
  const description = isNe
    ? "कालीमाटी लगायत नेपालभरिका कृषि बजारहरूबाट आजको थोक मूल्य विवरण। दैनिक औसत, न्यूनतम र अधिकतम दरहरू।"
    : "Today's wholesale agricultural commodity rates from Kalimati and other markets across Nepal. Daily updated average, minimum, and maximum prices.";

  return getSeoMetadata({
    locale: locale as "en" | "ne",
    path: "",
    title,
    description,
  });
}

export default async function DashboardPage(props: PageProps) {
  const { locale } = await props.params;
  
  if (locale !== "en" && locale !== "ne") {
    notFound();
  }

  const dict = await getDictionary(locale as "en" | "ne");

  const jsonLdData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Krishi Mulya",
    "url": `https://krishimulya.com/${locale}`,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `https://krishimulya.com/${locale}?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <>
      <JsonLd data={jsonLdData} />
      <CommodityListingPage
        locale={locale as "en" | "ne"}
        dict={dict}
        title={dict.dashboard.title}
        sourcePage="dashboard"
        searchParams={props.searchParams}
      />
    </>
  );
}

