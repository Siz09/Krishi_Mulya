import CommodityListingPage from "@/components/commodity/CommodityListingPage";

export const revalidate = 1800; // revalidate every 30 minutes

interface PageProps {
  searchParams: Promise<{ q?: string; market?: string }>;
}

export default async function FishPage(props: PageProps) {
  return (
    <CommodityListingPage
      category="fish"
      title="Fish Wholesale Prices in Nepal"
      sourcePage="fish"
      searchParams={props.searchParams}
    />
  );
}
