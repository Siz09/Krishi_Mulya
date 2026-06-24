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
  const catName = dict.nav.staples;
  
  const title = isNe
    ? `आजको ${catName} मूल्य — खाद्य बजार र डब्लुएफपी`
    : `Today's ${catName} Prices in Nepal — WFP Retail Monitor`;
  
  const description = isNe
    ? `नेपालभरिका बजारहरूबाट आजको ताजा ${catName} खुदरा मूल्य दरहरू।`
    : `Today's retail ${catName.toLowerCase()} rates in Nepal from WFP retail price monitoring. Get latest average rates.`;

  return getSeoMetadata({
    locale: locale as "en" | "ne",
    path: "staples",
    title,
    description,
  });
}

export default async function StaplesPage(props: PageProps) {
  const { locale } = await props.params;
  if (locale !== "en" && locale !== "ne") {
    notFound();
  }
  const dict = await getDictionary(locale as "en" | "ne");

  return (
    <CommodityListingPage
      locale={locale as "en" | "ne"}
      dict={dict}
      category="staple"
      title={dict.nav.staples}
      sourcePage="staples"
      searchParams={props.searchParams}
    />
  );
}
