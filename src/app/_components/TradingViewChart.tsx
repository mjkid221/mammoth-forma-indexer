"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, type Time } from "lightweight-charts";
import { type TimeData } from "./types";

interface ChartProps {
  data: TimeData[];
  timeInterval: "1w" | "1d" | "4h" | "15m" | "10m" | "5m";
}

export function TradingViewChart({ data, timeInterval }: ChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<unknown>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const getTimeFormatter = (interval: typeof timeInterval) => {
      return (time: Time) => {
        const date = new Date((time as number) * 1000);

        switch (interval) {
          case "1w":
            return date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
          case "1d":
            return date.toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              hour12: false,
            });
          case "4h":
            return date.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            });
          case "15m":
          case "10m":
          case "5m":
            return date.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            });
        }
      };
    };

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#999",
      },
      grid: {
        vertLines: { color: "rgba(42, 46, 57, 0.1)" },
        horzLines: { color: "rgba(42, 46, 57, 0.1)" },
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: getTimeFormatter(timeInterval),
      },
      crosshair: {
        horzLine: {
          visible: true,
          labelVisible: true,
        },
        vertLine: {
          visible: true,
          labelVisible: true,
        },
      },
    });

    const lineSeries = chart.addLineSeries({
      color: "#2563eb",
      lineWidth: 2,
    });

    lineSeries.setData(data);

    chart.timeScale().fitContent();

    chartRef.current = chart;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [data, timeInterval]);

  return <div ref={chartContainerRef} className="h-[500px] w-full" />;
}
