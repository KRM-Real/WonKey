"use client";

import { ReactNode } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  value: string;
  series: Array<{ value: number }>;
  trend: string;
  trendDirection?: "up" | "down" | "neutral";
  color: string;
  detail?: ReactNode;
};

export function MetricCard({ title, value, series, trend, trendDirection = "neutral", color, detail }: Props) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-slate-900">{value}</p>
          </div>
          <div
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
              trendDirection === "up" && "bg-emerald-50 text-emerald-700",
              trendDirection === "down" && "bg-red-50 text-red-700",
              trendDirection === "neutral" && "bg-slate-100 text-slate-600",
            )}
          >
            {trendDirection === "up" ? <TrendingUp className="h-3.5 w-3.5" /> : null}
            {trendDirection === "down" ? <TrendingDown className="h-3.5 w-3.5" /> : null}
            {trend}
          </div>
        </div>
        <div className="h-20">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series}>
              <defs>
                <linearGradient id={`metric-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                fill={`url(#metric-${title})`}
                fillOpacity={1}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {detail ? <div className="mt-3 text-xs text-slate-500">{detail}</div> : null}
      </CardContent>
    </Card>
  );
}
