import CommodityListingPage from "@/components/commodity/CommodityListingPage";

export const revalidate = 1800;

interface PageProps {
  searchParams: Promise<{ q?: string; market?: string }>;
}

export default async function MushroomsPage(props: PageProps) {
  return (
    <CommodityListingPage
      category="mushroom"
      title="Mushrooms Wholesale Prices in Nepal"
      sourcePage="mushrooms"
      searchParams={props.searchParams}
    />
  );
}
