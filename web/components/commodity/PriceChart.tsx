"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { DailyPrice } from "@/lib/supabase";
import { TrendingUp } from "lucide-react";
import NepaliDate from "nepali-date-converter";
import { toNepaliDigits, formatBSDate, formatMonthlyDate } from "@/lib/format";

interface PriceChartProps {
  history: DailyPrice[];
  locale?: "en" | "ne";
  frequency?: "daily" | "monthly";
}

export default function PriceChart({
  history,
  locale = "en",
  frequency,
}: PriceChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (history.length === 0) {
    return (
      <div className="h-80 w-full flex flex-col items-center justify-center border border-leaf-100 bg-soil-50/20 rounded-xl p-8 text-center text-sm text-soil-800/60">
        <TrendingUp className="h-9 w-9 text-soil-800/40 mb-2" />
        <p className="font-semibold text-soil-800">
          {locale === "ne" ? "इतिहास उपलब्ध छैन" : "No History Available Yet"}
        </p>
        <p className="text-xs text-soil-800/60 mt-1 max-w-xs">
          {locale === "ne"
            ? "डाटा संकलन भएपछि मूल्य इतिहास यहाँ देखा पर्नेछ — भोलि पुनः प्रयास गर्नुहोस्।"
            : "Price history will appear here as data accumulates — check back tomorrow."}
        </p>
      </div>
    );
  }

  // Detect frequency if not explicitly provided
  const detectedFrequency = frequency || history[0]?.price_frequency || "daily";
  const isMonthly = detectedFrequency === "monthly";

  // Helper to format short X-axis ticks (e.g. Jes '83 or जे '८३)
  const formatXAxisDate = (dateStr: string) => {
    try {
      const dateObj = new Date(dateStr);
      const bsDate = new NepaliDate(dateObj);
      const bsMonth = bsDate.getMonth();
      const bsMonthsEn = [
        "Bai", "Jes", "Ash", "Shr", "Bha", "Ashw",
        "Kar", "Man", "Pou", "Mag", "Fal", "Cha"
      ];
      const bsMonthsNe = [
        "वै", "जे", "अ", "सा", "भ", "असो",
        "का", "मं", "पु", "मा", "फा", "चै"
      ];
      const monthLabel = locale === "ne" ? bsMonthsNe[bsMonth] : bsMonthsEn[bsMonth];
      const yearLabel = String(bsDate.getYear()).slice(-2);
      const formattedYear = locale === "ne" ? toNepaliDigits(yearLabel) : yearLabel;
      return `${monthLabel} '${formattedYear}`;
    } catch {
      return dateStr;
    }
  };

  // Format data for the chart
  const data = history.map((item) => {
    const dateLabel = isMonthly
      ? formatXAxisDate(item.price_date)
      : item.price_date.slice(5); // e.g. "06-16"

    const fullDateLabel = isMonthly
      ? formatMonthlyDate(item.price_date, locale)
      : formatBSDate(item.price_date, locale);

    return {
      date: dateLabel,
      fullName: fullDateLabel,
      avg: item.avg_price,
      min: item.min_price,
      max: item.max_price,
    };
  });

  const prefix = locale === "ne" ? "रु" : "Rs.";
  const labelMap: Record<string, string> = locale === "ne"
    ? { avg: "औसत", min: "न्यूनतम", max: "अधिकतम" }
    : { avg: "Average", min: "Minimum", max: "Maximum" };

  if (!isMounted) {
    return <div className="h-80 w-full bg-soil-50/20 rounded-xl animate-pulse" />;
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        {isMonthly ? (
          <BarChart
            data={data}
            margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e6f3ec" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#3a2a1d", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#3a2a1d", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(val) => {
                const formattedVal = locale === "ne" ? toNepaliDigits(String(val)) : String(val);
                return `${prefix} ${formattedVal}`;
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #dcf0e4",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(15, 74, 46, 0.08)",
              }}
              labelClassName="font-bold text-soil-800 text-xs"
              labelFormatter={(label, items) => items?.[0]?.payload?.fullName || label}
              formatter={(value: any) => {
                const formattedVal = locale === "ne" ? toNepaliDigits(String(value)) : String(value);
                const nameLabel = locale === "ne" ? "खुदरा मूल्य" : "Retail Price";
                return [`${prefix} ${formattedVal}`, nameLabel];
              }}
            />
            <Bar
              dataKey="avg"
              name="avg"
              fill="#00694c" // leaf-600
              radius={[4, 4, 0, 0]}
              maxBarSize={45}
            />
          </BarChart>
        ) : (
          <LineChart
            data={data}
            margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e6f3ec" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#3a2a1d", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(val) => (locale === "ne" ? toNepaliDigits(String(val)) : String(val))}
            />
            <YAxis
              tick={{ fill: "#3a2a1d", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(val) => {
                const formattedVal = locale === "ne" ? toNepaliDigits(String(val)) : String(val);
                return `${prefix} ${formattedVal}`;
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #dcf0e4",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(15, 74, 46, 0.08)",
              }}
              labelClassName="font-bold text-soil-800 text-xs"
              labelFormatter={(label, items) => items?.[0]?.payload?.fullName || label}
              formatter={(value: any, name: any) => {
                const label = labelMap[name] || name;
                const formattedVal = locale === "ne" ? toNepaliDigits(String(value)) : String(value);
                return [`${prefix} ${formattedVal}`, label];
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
            />
            <Line
              type="monotone"
              dataKey="avg"
              name="avg"
              stroke="#00694c" // leaf-600
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="max"
              name="max"
              stroke="#d97706" // amber-600 (price-up)
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="min"
              name="min"
              stroke="#2563eb" // blue-600 (price-down)
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
