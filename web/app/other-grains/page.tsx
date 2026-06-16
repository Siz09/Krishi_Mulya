import CommodityListingPage from "@/components/commodity/CommodityListingPage";

export const revalidate = 1800;

interface PageProps {
  searchParams: Promise<{ q?: string; market?: string }>;
}

export default async function OtherGrainsPage(props: PageProps) {
  return (
    <CommodityListingPage
      category="other"
      title="Other Crops & Grains Wholesale Prices in Nepal"
      sourcePage="other-grains"
      searchParams={props.searchParams}
    />
  );
}
