import CommodityListingPage from "@/components/commodity/CommodityListingPage";

export const revalidate = 1800;

interface PageProps {
  searchParams: Promise<{ q?: string; market?: string }>;
}

export default async function RootVegetablesPage(props: PageProps) {
  return (
    <CommodityListingPage
      category="root_vegetable"
      title="Root Vegetables Wholesale Prices in Nepal"
      sourcePage="root-vegetables"
      searchParams={props.searchParams}
    />
  );
}
