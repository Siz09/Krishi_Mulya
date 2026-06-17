import { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://krishimulya.com";
  const locales = ["en", "ne"];
  const categories = [
    "vegetables",
    "fruits",
    "fish",
    "meat",
    "dairy",
    "spices",
    "leafy-greens",
    "mushrooms",
    "root-vegetables",
    "legumes",
    "other-grains",
  ];

  const routes: MetadataRoute.Sitemap = [];

  // Add dashboard routes
  for (const locale of locales) {
    routes.push({
      url: `${baseUrl}/${locale}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    });

    // Add category routes
    for (const cat of categories) {
      routes.push({
        url: `${baseUrl}/${locale}/${cat}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.8,
      });
    }
  }

  // Fetch active commodities from Supabase
  const { data: commodities, error } = await supabase
    .from("commodities")
    .select("slug")
    .eq("active", true);

  if (!error && commodities) {
    for (const commodity of commodities) {
      for (const locale of locales) {
        routes.push({
          url: `${baseUrl}/${locale}/commodity/${commodity.slug}`,
          lastModified: new Date(),
          changeFrequency: "daily",
          priority: 0.6,
        });
      }
    }
  }

  return routes;
}
