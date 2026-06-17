import CommodityListingPage from "@/components/commodity/CommodityListingPage";
import { getDictionary } from "@/lib/dictionary";
import { notFound } from "next/navigation";

export const revalidate = 1800; // revalidate every 30 minutes

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; market?: string; page?: string }>;
}

export default async function LeafyGreensPage(props: PageProps) {
  const { locale } = await props.params;
  if (locale !== "en" && locale !== "ne") {
    notFound();
  }
  const dict = await getDictionary(locale as "en" | "ne");

  return (
    <CommodityListingPage
      locale={locale as "en" | "ne"}
      dict={dict}
      category="leafy_green"
      title={dict.nav.leafy_greens}
      sourcePage="leafy-greens"
      searchParams={props.searchParams}
    />
  );
}
