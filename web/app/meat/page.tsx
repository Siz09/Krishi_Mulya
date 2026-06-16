import CommodityListingPage from "@/components/commodity/CommodityListingPage";

export const revalidate = 1800;

interface PageProps {
  searchParams: Promise<{ q?: string; market?: string }>;
}

export default async function MeatPage(props: PageProps) {
  return (
    <CommodityListingPage
      category="meat"
      title="Meat Wholesale Prices in Nepal"
      sourcePage="meat"
      searchParams={props.searchParams}
    />
  );
}
