import type { Metadata } from "next";
import CommodityListingPage from "@/components/commodity/CommodityListingPage";
import { getDictionary } from "@/lib/dictionary";
import { notFound } from "next/navigation";
import { getSeoMetadata } from "@/lib/seo";

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
  const dict = await getDictionary(locale as "en" | "ne");
  const isNe = locale === "ne";
  const catName = dict.nav.legumes;
  
  const title = isNe
    ? `आजको ${catName} मूल्य — कालीमाटी बजार`
    : `Today's ${catName} Prices in Nepal — Kalimati Market`;
  
  const description = isNe
    ? `कालीमाटी लगायत नेपालका प्रमुख बजारहरूबाट आजको ताजा ${catName}को थोक मूल्य दरहरू।`
    : `Today's wholesale ${catName.toLowerCase()} rates in Nepal from Kalimati and other regional markets. Get latest average rates.`;

  return getSeoMetadata({
    locale: locale as "en" | "ne",
    path: "legumes",
    title,
    description,
  });
}

export default async function LegumesPage(props: PageProps) {
  const { locale } = await props.params;
  if (locale !== "en" && locale !== "ne") {
    notFound();
  }
  const dict = await getDictionary(locale as "en" | "ne");

  return (
    <CommodityListingPage
      locale={locale as "en" | "ne"}
      dict={dict}
      category="legume"
      title={dict.nav.legumes}
      sourcePage="legumes"
      searchParams={props.searchParams}
    />
  );
}
