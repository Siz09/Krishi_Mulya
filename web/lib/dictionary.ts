import type enDict from "@/dictionaries/en.json";

export type Dictionary = typeof enDict;

const dictionaries = {
  en: () => import("@/dictionaries/en.json").then((module) => module.default),
  ne: () => import("@/dictionaries/ne.json").then((module) => module.default),
};

export const getDictionary = async (locale: "en" | "ne"): Promise<Dictionary> => {
  if (locale === "ne") return dictionaries.ne();
  return dictionaries.en();
};
