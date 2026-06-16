import CommodityListingPage from "@/components/commodity/CommodityListingPage";

export const revalidate = 1800; // revalidate every 30 minutes

interface PageProps {
  searchParams: Promise<{ q?: string; market?: string }>;
}

export default async function DashboardPage(props: PageProps) {
  return (
    <CommodityListingPage
      title="Today's Agriculture Prices in Nepal"
      sourcePage="dashboard"
      searchParams={props.searchParams}
    />
  );
}
