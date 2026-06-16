import CommodityListingPage from "@/components/commodity/CommodityListingPage";

export const revalidate = 1800;

interface PageProps {
  searchParams: Promise<{ q?: string; market?: string }>;
}

export default async function SpicesPage(props: PageProps) {
  return (
    <CommodityListingPage
      category="spice"
      title="Spices Wholesale Prices in Nepal"
      sourcePage="spices"
      searchParams={props.searchParams}
    />
  );
}
