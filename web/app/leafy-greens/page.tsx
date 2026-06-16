import CommodityListingPage from "@/components/commodity/CommodityListingPage";

export const revalidate = 1800;

interface PageProps {
  searchParams: Promise<{ q?: string; market?: string }>;
}

export default async function LeafyGreensPage(props: PageProps) {
  return (
    <CommodityListingPage
      category="leafy_green"
      title="Leafy Greens Wholesale Prices in Nepal"
      sourcePage="leafy-greens"
      searchParams={props.searchParams}
    />
  );
}
