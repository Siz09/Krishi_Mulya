import CommodityListingPage from "@/components/commodity/CommodityListingPage";

export const revalidate = 1800; // revalidate every 30 minutes

interface PageProps {
  searchParams: Promise<{ q?: string; market?: string }>;
}

export default async function FruitsPage(props: PageProps) {
  return (
    <CommodityListingPage
      category="fruit"
      title="Fruit Wholesale Prices in Nepal"
      sourcePage="fruits"
      searchParams={props.searchParams}
    />
  );
}
