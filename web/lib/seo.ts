import type { Metadata } from "next";

export function getSeoMetadata({
  locale,
  path,
  title,
  description,
}: {
  locale: "en" | "ne";
  path: string;
  title: string;
  description: string;
}): Metadata {
  const cleanPath = path ? (path.startsWith("/") ? path.slice(1) : path) : "";
  const baseUrl = "https://krishimulya.com";
  
  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/${locale}/${cleanPath}`,
      languages: {
        en: `${baseUrl}/en/${cleanPath}`,
        ne: `${baseUrl}/ne/${cleanPath}`,
        "x-default": `${baseUrl}/en/${cleanPath}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${locale}/${cleanPath}`,
      siteName: "Krishi Mulya",
      locale: locale === "ne" ? "ne_NP" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
