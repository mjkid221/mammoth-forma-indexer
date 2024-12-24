"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  type Time,
  ISeriesApi,
} from "lightweight-charts";
import {
  ChartProps,
  ChartType,
  MultiValueTimeData,
  type TimeData,
} from "./types";

function convertToHeikinAshi<T extends MultiValueTimeData>(data: T[]): T[] {
  const haData: T[] = [];

  for (let i = 0; i < data.length; i++) {
    const current = data[i]!;
    const previous = haData[i - 1] || current;

    // Heikin-Ashi calculations
    const haClose =
      (current.open + current.high + current.low + current.close) / 4;
    const haOpen =
      i === 0
        ? (current.open + current.close) / 2
        : (previous.open + previous.close) / 2;
    const haHigh = Math.max(current.high, haOpen, haClose);
    const haLow = Math.min(current.low, haOpen, haClose);

    haData.push({
      time: current.time,
      open: haOpen,
      high: haHigh,
      low: haLow,
      close: haClose,
    } as T);
  }

  return haData;
}

export function TradingViewChart<T extends TimeData>({
  data,
  timeInterval,
  chartType = ChartType.REGULAR,
}: ChartProps<T>) {
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

    let chartSeries: ISeriesApi<any>; // TODO: add better types

    switch (chartType) {
      case ChartType.LINE:
        chartSeries = chart.addLineSeries({
          color: "#26a69a",
        });
        break;
      default:
        chartSeries = chart.addCandlestickSeries({
          upColor: "#26a69a",
          downColor: "#ef5350",
          borderVisible: false,
          wickUpColor: "#26a69a",
          wickDownColor: "#ef5350",
        });
        break;
    }

    // Use regular or Heikin-Ashi data based on chartType
    const chartData =
      chartType === ChartType.HEIKIN_ASHI
        ? convertToHeikinAshi(data as MultiValueTimeData[])
        : data;
    chartSeries.setData(chartData);

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
  }, [data, timeInterval, chartType]);

  return <div ref={chartContainerRef} className="h-[500px] w-full" />;
}
