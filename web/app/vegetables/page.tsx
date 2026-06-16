import CommodityListingPage from "@/components/commodity/CommodityListingPage";

export const revalidate = 1800; // revalidate every 30 minutes

interface PageProps {
  searchParams: Promise<{ q?: string; market?: string }>;
}

export default async function VegetablesPage(props: PageProps) {
  return (
    <CommodityListingPage
      category="vegetable"
      title="Vegetable Wholesale Prices in Nepal"
      sourcePage="vegetables"
      searchParams={props.searchParams}
    />
  );
}
