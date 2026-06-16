import CommodityListingPage from "@/components/commodity/CommodityListingPage";

export const revalidate = 1800;

interface PageProps {
  searchParams: Promise<{ q?: string; market?: string }>;
}

export default async function DairyPage(props: PageProps) {
  return (
    <CommodityListingPage
      category="dairy"
      title="Dairy Products Wholesale Prices in Nepal"
      sourcePage="dairy"
      searchParams={props.searchParams}
    />
  );
}
