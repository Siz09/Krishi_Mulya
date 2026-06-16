"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { DailyPrice } from "@/lib/supabase";

interface PriceChartProps {
  history: DailyPrice[];
  locale?: "en" | "ne";
}

export default function PriceChart({ history, locale = "en" }: PriceChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (history.length <= 1) {
    return (
      <div className="h-80 w-full flex flex-col items-center justify-center border border-leaf-100 bg-soil-50/20 rounded-xl p-8 text-center text-sm text-soil-800/60">
        <span className="material-symbols-outlined text-[36px] text-soil-800/40 mb-2">
          show_chart
        </span>
        <p className="font-semibold text-soil-800">No History Available Yet</p>
        <p className="text-xs text-soil-800/60 mt-1 max-w-xs">
          Price history will appear here as data accumulates — check back tomorrow.
        </p>
      </div>
    );
  }

  // Format data for the chart
  const data = history.map((item) => ({
    date: item.price_date.slice(5), // e.g., "06-16"
    avg: item.avg_price,
    min: item.min_price,
    max: item.max_price,
  }));

  if (!isMounted) {
    return <div className="h-80 w-full bg-soil-50/20 rounded-xl animate-pulse" />;
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
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
          />
          <YAxis
            tick={{ fill: "#3a2a1d", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(val) => `Rs. ${val}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #dcf0e4",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(15, 74, 46, 0.08)",
            }}
            labelClassName="font-bold text-soil-800 text-xs"
            formatter={(value: any, name: any) => {
              const label =
                name === "avg"
                  ? "Average"
                  : name === "min"
                  ? "Minimum"
                  : "Maximum";
              return [`Rs. ${value}`, label];
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
      </ResponsiveContainer>
    </div>
  );
}
