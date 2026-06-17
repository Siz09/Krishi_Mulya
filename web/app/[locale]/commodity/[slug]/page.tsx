import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getSeoMetadata } from "@/lib/seo";
import JsonLd from "@/components/shared/JsonLd";
import { getCommodityWithChange, getCommodityHistory, getObservationsForDate, getPricesAcrossMarkets } from "@/lib/queries/prices";
import { formatPrice, formatBSDate } from "@/lib/format";
import { getProductImageUrl } from "@/lib/commodityDetails";
import PriceChangeBadge from "@/components/commodity/PriceChangeBadge";
import PriceChart from "@/components/commodity/PriceChart";
import AlertSignupForm from "@/components/shared/AlertSignupForm";
import { getDictionary } from "@/lib/dictionary";
import { ChevronRight, Home, HelpCircle, MapPin } from "lucide-react";

export const revalidate = 1800; // revalidate every 30 minutes

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
  searchParams: Promise<{ market?: string }>;
}

const MARKET_LABELS: Record<string, Record<"en" | "ne", string>> = {
  kalimati: { en: "Kathmandu (Kalimati)", ne: "काठमाडौं (कालीमाटी)" },
  birtamod: { en: "Birtamod", ne: "विर्तामोड" },
  dharan: { en: "Dharan", ne: "धरान" },
  dhalkebar: { en: "Dhalkebar", ne: "ढल्केबर" },
  kamalamai: { en: "Kamalamai", ne: "कमलामाई" },
  kawasoti: { en: "Kawasoti", ne: "कावासोती" },
  pokhara: { en: "Pokhara", ne: "पोखरा" },
  butwal: { en: "Butwal", ne: "बुटवल" },
  kohalpur: { en: "Kohalpur", ne: "कोहलपुर" },
  birendranagar: { en: "Birendranagar", ne: "वीरेन्द्रनगर" },
  attariya: { en: "Attariya", ne: "अत्तरिया" },
  lalbandi: { en: "Lalbandi", ne: "लालबन्दी" },
};

const CATEGORY_KEYS: Record<string, string> = {
  vegetable: "vegetables",
  fruit: "fruits",
  spice: "spices",
  leafy_green: "leafy_greens",
  mushroom: "mushrooms",
  root_vegetable: "root_vegetables",
  legume: "legumes",
  fish: "fish",
  meat: "meat",
  dairy: "dairy",
  other: "other_grains",
};

const getCategoryLink = (category: string, locale: string) => {
  const mapping: Record<string, string> = {
    vegetable: "vegetables",
    fruit: "fruits",
    spice: "spices",
    leafy_green: "leafy-greens",
    mushroom: "mushrooms",
    root_vegetable: "root-vegetables",
    legume: "legumes",
    fish: "fish",
    meat: "meat",
    dairy: "dairy",
    other: "other-grains",
  };
  const path = mapping[category] || "";
  return `/${locale}/${path}`;
};

const getConfidenceLabel = (confidence: string, locale: "en" | "ne") => {
  if (!confidence) return locale === "ne" ? "अज्ञात" : "Unknown";
  const upper = confidence.toUpperCase();
  if (upper.includes("HIGH")) {
    return locale === "ne" ? "उच्च (एकल स्रोत)" : confidence;
  }
  if (upper.includes("MEDIUM")) {
    return locale === "ne" ? "मध्यम" : confidence;
  }
  if (upper.includes("LOW")) {
    return locale === "ne" ? "निम्न" : confidence;
  }
  return confidence;
};

const getSourceLabel = (name: string, locale: "en" | "ne") => {
  if (name === "Government AMPIS Feed") {
    return locale === "ne" ? "सरकारी AMPIS फिड" : name;
  }
  return name;
};

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const resolvedSearchParams = await props.searchParams;
  const locale = params.locale === "ne" ? "ne" : "en";
  const market = resolvedSearchParams.market || "kalimati";
  const commodity = await getCommodityWithChange(params.slug, market);
  if (!commodity) return {};
  
  const activeMarket = commodity.market;
  const marketLabel = MARKET_LABELS[activeMarket]?.[locale] || activeMarket;
  
  const title = locale === "ne"
    ? `${commodity.name_ne} को आजको मूल्य — ${marketLabel}`
    : `${commodity.name_en} Wholesale Price Today — ${marketLabel}`;

  const description = locale === "ne"
    ? `${marketLabel} बजारमा आजको ${commodity.name_ne} को थोक मूल्य। दैनिक औसत, न्यूनतम र अधिकतम मूल्य तथा इतिहास।`
    : `Today's wholesale price for ${commodity.name_en} in ${marketLabel} Market. Latest average rate, min, max, and historical chart.`;

  return getSeoMetadata({
    locale,
    path: `commodity/${params.slug}`,
    title,
    description,
  });
}

export default async function CommodityDetailPage(props: PageProps) {
  const params = await props.params;
  const resolvedSearchParams = await props.searchParams;
  const slug = params.slug;
  const locale = params.locale === "ne" ? "ne" : "en";
  const market = resolvedSearchParams.market || "kalimati";

  const dict = await getDictionary(locale);

  const commodity = await getCommodityWithChange(slug, market);
  if (!commodity) {
    notFound();
  }

  const activeMarket = commodity.market;
  const marketLabel = MARKET_LABELS[activeMarket]?.[locale] || activeMarket;

  const { history } = await getCommodityHistory(slug, 30, activeMarket); // fetch last 30 days
  const observations = commodity.price_date
    ? await getObservationsForDate(commodity.commodity_id, activeMarket, commodity.price_date)
    : [];
  const allLocationsPrices = await getPricesAcrossMarkets(slug);

  const categoryKey = CATEGORY_KEYS[commodity.category] || commodity.category;
  const categoryLabel = dict.nav[categoryKey as keyof typeof dict.nav] || commodity.category;
  const categoryLink = getCategoryLink(commodity.category, locale);
  const name = locale === "ne" ? commodity.name_ne : commodity.name_en;
  const description = locale === "ne"
    ? `${marketLabel} बजारमा आजको ${commodity.name_ne} को थोक मूल्य। दैनिक औसत: रु ${commodity.avg_price}।`
    : `Today's wholesale price for ${commodity.name_en} in ${marketLabel} Market. Average: Rs. ${commodity.avg_price}.`;

  const offers: any = {
    "@type": "AggregateOffer",
    "priceCurrency": "NPR",
  };
  if (commodity.min_price !== null) offers.lowPrice = commodity.min_price;
  if (commodity.max_price !== null) offers.highPrice = commodity.max_price;
  if (commodity.avg_price !== null) offers.price = commodity.avg_price;
  offers.priceUnit = commodity.unit;

  const jsonLdData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": locale === "ne" ? `${commodity.name_ne} को आजको मूल्य` : `${commodity.name_en} Price Today`,
    "description": description,
    "url": `https://krishimulya.com/${locale}/commodity/${slug}`,
    "mainEntity": {
      "@type": "Product",
      "name": name,
      "offers": offers
    }
  };

  return (
    <>
      <JsonLd data={jsonLdData} />
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
      
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs font-semibold text-soil-800/60" aria-label="Breadcrumb">
        <Link href={`/${locale}`} className="hover:text-leaf-600 flex items-center gap-1 transition-colors">
          <Home className="h-3.5 w-3.5" />
          <span>{dict.nav.home}</span>
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-soil-800/30" />
        <Link href={categoryLink} className="hover:text-leaf-600 transition-colors capitalize">
          {categoryLabel}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-soil-800/30" />
        <span className="text-soil-800 font-bold truncate max-w-[200px]" aria-current="page">
          {locale === "ne" ? commodity.name_ne : commodity.name_en}
        </span>
      </nav>

      {/* Title Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-leaf-100">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-leaf-700 tracking-tight">
            {locale === "ne" ? commodity.name_ne : commodity.name_en}
          </h1>
          <h2 className="text-xl sm:text-2xl font-bold font-devanagari text-soil-800/60 mt-1">
            {locale === "ne" ? commodity.name_en : commodity.name_ne}
          </h2>
        </div>
        <div className="flex gap-2">
          <span className="inline-flex items-center rounded-md bg-leaf-50 px-2.5 py-1 text-xs font-semibold text-leaf-700 border border-leaf-100 capitalize">
            {categoryLabel}
          </span>
          {commodity.price_date && (
            <span className="inline-flex items-center rounded-md bg-soil-50 px-2.5 py-1 text-xs font-semibold text-soil-800/70 border border-leaf-100/50">
              {dict.footer.updated}: {formatBSDate(commodity.price_date, locale)}
            </span>
          )}
        </div>
      </header>

      {/* Grid Layout (Stats & Chart Left, Info Sidebar Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Stats & Chart */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            
            <div className="bg-white border border-leaf-100 rounded-xl p-4 flex flex-col justify-between shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-soil-800/50">{dict.commodity.avg}</span>
              <div className="text-xl sm:text-2xl font-black text-leaf-700 mt-1">
                {formatPrice(commodity.avg_price, commodity.unit, locale, { priceOnly: true })}
              </div>
              <span className="text-[10px] text-soil-800/40 mt-1">
                {locale === "ne" ? `प्रति ${commodity.unit}` : `per ${commodity.unit}`}
              </span>
            </div>

            <div className="bg-white border border-leaf-100 rounded-xl p-4 flex flex-col justify-between shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-soil-800/50">{dict.commodity.min}</span>
              <div className="text-lg sm:text-xl font-extrabold text-blue-600 mt-1">
                {formatPrice(commodity.min_price, commodity.unit, locale, { priceOnly: true })}
              </div>
              <span className="text-[10px] text-soil-800/40 mt-1">
                {locale === "ne" ? `प्रति ${commodity.unit}` : `per ${commodity.unit}`}
              </span>
            </div>

            <div className="bg-white border border-leaf-100 rounded-xl p-4 flex flex-col justify-between shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-soil-800/50">{dict.commodity.max}</span>
              <div className="text-lg sm:text-xl font-extrabold text-amber-600 mt-1">
                {formatPrice(commodity.max_price, commodity.unit, locale, { priceOnly: true })}
              </div>
              <span className="text-[10px] text-soil-800/40 mt-1">
                {locale === "ne" ? `प्रति ${commodity.unit}` : `per ${commodity.unit}`}
              </span>
            </div>

            <div className="bg-white border border-leaf-100 rounded-xl p-4 flex flex-col justify-between shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-soil-800/50">{dict.commodity.change_1d}</span>
              <div className="mt-1">
                <PriceChangeBadge pct={commodity.change_1d_pct} locale={locale} />
              </div>
              <span className="text-[10px] text-soil-800/40 mt-2">
                {locale === "ne" ? "हिजोको तुलनामा" : "vs yesterday"}
              </span>
            </div>

            <div className="bg-white border border-leaf-100 rounded-xl p-4 flex flex-col justify-between shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-soil-800/50">{dict.commodity.change_7d}</span>
              <div className="mt-1">
                <PriceChangeBadge pct={commodity.change_7d_pct} locale={locale} />
              </div>
              <span className="text-[10px] text-soil-800/40 mt-2">
                {locale === "ne" ? "गत हप्ताको तुलनामा" : "vs last week"}
              </span>
            </div>

          </div>

          {/* Chart Card */}
          <div className="bg-white border border-leaf-100 rounded-xl p-6 shadow-sm">
            <header className="flex justify-between items-center mb-6">
              <h3 className="text-base font-bold text-soil-800">
                {dict.commodity.price_history}
              </h3>
              <span className="text-[10px] font-bold bg-leaf-50 text-leaf-700 px-2 py-0.5 rounded border border-leaf-100">
                {locale === "ne" ? "३० दिन" : "30 Days"}
              </span>
            </header>
            <PriceChart history={history} locale={locale} />
          </div>

        </div>

        {/* Right Column: Sidebar */}
        <aside className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Featured Commodity Visual Card */}
          <div className="bg-white border border-leaf-100 rounded-xl overflow-hidden shadow-sm hover:shadow-interactive transition-all group flex flex-col">
            <div className="relative w-full h-48 bg-leaf-50 overflow-hidden">
              <Image
                src={getProductImageUrl(commodity.slug, commodity.category)}
                alt={commodity.name_en}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-w-768px) 100vw, 320px"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-soil-800/90 via-soil-800/20 to-transparent" />
              
              <div className="absolute bottom-4 left-4 right-4 animate-fade-in">
                <span className="inline-block px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider bg-leaf-600/90 text-white rounded">
                  {categoryLabel}
                </span>
                <h3 className="text-white text-lg font-black leading-tight mt-1.5">
                  {locale === "ne" ? commodity.name_ne : commodity.name_en}
                </h3>
                <span className="text-leaf-100/90 text-sm font-semibold font-devanagari block mt-0.5">
                  {locale === "ne" ? commodity.name_en : commodity.name_ne}
                </span>
              </div>
            </div>
          </div>

          {/* Validation & Consensus Status Card */}
          <div className="bg-white border border-leaf-100 rounded-xl overflow-hidden shadow-sm">
            <div className="p-5 flex flex-col gap-4">
              <h3 className="font-bold text-sm text-soil-800 flex items-center gap-1.5">
                <HelpCircle className="h-4 w-4 text-leaf-600" />
                {locale === "ne" ? "सहमति प्रमाणीकरण" : "Consensus Verification"}
              </h3>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-soil-800/50">{locale === "ne" ? "विश्वासस्तर:" : "Confidence:"}</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase border ${
                    commodity.confidence?.toLowerCase().includes("high")
                      ? "bg-leaf-50 text-leaf-700 border-leaf-100"
                      : commodity.confidence?.toLowerCase().includes("medium")
                      ? "bg-amber-50 text-amber-700 border-amber-100"
                      : "bg-rose-50 text-rose-700 border-rose-100"
                  }`}>
                    {getConfidenceLabel(commodity.confidence, locale)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-soil-800/50">{locale === "ne" ? "प्रमाणित स्रोतहरू:" : "Sources Verified:"}</span>
                  <span className="font-bold text-soil-800">{commodity.source_count || 1}</span>
                </div>
              </div>

              {observations.length > 0 && (
                <div className="border-t border-leaf-100/60 pt-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-soil-800/40 block mb-2">
                    {locale === "ne" ? "आजका स्रोत रिपोर्टहरू" : "Source Reports for Today"}
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {observations.map((obs) => (
                      <div key={obs.id} className="flex justify-between items-center text-xs p-2 bg-soil-50/50 rounded-lg border border-leaf-100/40">
                        <span className="capitalize font-semibold text-soil-800/80 flex items-center gap-1">
                          {getSourceLabel(obs.sources?.name || "Unknown Source", locale)}
                          {!obs.sources?.is_independent && (
                            <span className="text-[9px] px-1 bg-amber-100 text-amber-800 rounded font-normal normal-case">
                              {locale === "ne" ? "मिरर" : "Mirror"}
                            </span>
                          )}
                        </span>
                        <span className="font-bold text-leaf-750">
                          {formatPrice(obs.avg_price, commodity.unit, locale, { priceOnly: true })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Compare across Locations Card */}
          {allLocationsPrices.length > 1 && (
            <div className="bg-white border border-leaf-100 rounded-xl overflow-hidden shadow-sm">
              <div className="p-5 flex flex-col gap-4">
                <h3 className="font-bold text-sm text-soil-800 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-leaf-600" />
                  {locale === "ne" ? "विभिन्न स्थानहरूको तुलना" : "Compare Across Locations"}
                </h3>
                <div className="flex flex-col gap-2">
                  {allLocationsPrices.map((p) => {
                    const isActive = p.market === activeMarket;
                    const label = MARKET_LABELS[p.market]?.[locale] || p.market;
                    return (
                      <div
                        key={p.market}
                        className={`flex justify-between items-center text-xs p-2.5 rounded-lg border transition-all ${
                          isActive
                            ? "bg-leaf-50/50 border-leaf-200 text-leaf-800 font-semibold"
                            : "bg-soil-50/30 border-leaf-100/40 hover:bg-leaf-50/30 hover:border-leaf-200"
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          {isActive ? (
                            <span className="capitalize">{label} ({locale === "ne" ? "सक्रिय" : "Current"})</span>
                          ) : (
                            <Link
                              href={`/${locale}/commodity/${slug}?market=${p.market}`}
                              className="capitalize hover:underline text-soil-800 hover:text-leaf-700"
                            >
                              {label}
                            </Link>
                          )}
                        </span>
                        <span className="font-bold text-soil-900">
                          {formatPrice(p.avg_price, p.unit, locale, { priceOnly: true })}
                          <span className="text-[10px] font-normal text-soil-800/50 ml-0.5">
                            /{p.unit}
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Info details card */}
          <div className="bg-white border border-leaf-100 rounded-xl overflow-hidden shadow-sm">
            <div className="p-5">
              <h3 className="font-bold text-sm text-soil-800 flex items-center gap-1.5 mb-2">
                <HelpCircle className="h-4 w-4 text-leaf-600" />
                {locale === "ne" ? "उत्पादन सम्बन्धी जानकारी" : "Commodity Information"}
              </h3>
              <p className="text-xs text-soil-800/70 leading-relaxed">
                {locale === "ne"
                  ? `थोक मूल्यहरूले ${marketLabel} थोक बजारमा दैनिक कारोबार दरहरूको प्रतिनिधित्व गर्दछ। मौसमी माग, फसलको अवस्था, यातायात र क्षेत्रीय आयातका आधारमा मूल्यहरू उतारचढाव हुन्छन्।`
                  : `Wholesale prices represent the average daily transacted rates at the ${marketLabel} wholesale market. Prices fluctuate based on seasonal demand, harvest conditions, transportation, and regional imports.`}
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="inline-block bg-soil-50 text-soil-800/70 border border-leaf-100/50 px-2 py-1 rounded text-[10px] font-semibold">
                  {locale === "ne" ? "माग निर्देशित" : "Demand-driven"}
                </span>
                <span className="inline-block bg-soil-50 text-soil-800/70 border border-leaf-100/50 px-2 py-1 rounded text-[10px] font-semibold">
                  {locale === "ne" ? "दैनिक अद्यावधिक" : "Daily Scrapes"}
                </span>
              </div>
            </div>
          </div>

          {/* Alert Form Widget */}
          <AlertSignupForm compact={true} sourcePage={`commodity/${slug}`} locale={locale} dict={dict} />

        </aside>

      </div>
    </div>
    </>
  );
}
