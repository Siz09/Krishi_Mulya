import CommodityListingPage from "@/components/commodity/CommodityListingPage";

export const revalidate = 1800;

interface PageProps {
  searchParams: Promise<{ q?: string; market?: string }>;
}

export default async function LegumesPage(props: PageProps) {
  return (
    <CommodityListingPage
      category="legume"
      title="Legumes & Pulses Wholesale Prices in Nepal"
      sourcePage="legumes"
      searchParams={props.searchParams}
    />
  );
}
