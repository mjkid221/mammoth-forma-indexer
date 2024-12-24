"use client";

import { useState, useEffect, memo } from "react";
import { Button } from "~/components/ui/button";
import { TradingViewChart } from "./TradingViewChart";
import { ChartType, type TimeData } from "./types";
import {
  DEFAULT_CHART_TYPE,
  DEFAULT_FILTER,
  DEFAULT_TIME_FRAME,
  TIME_INTERVAL_OPTIONS,
  TimeInterval,
} from "~/lib/constants/charts";
import { api } from "~/trpc/react";
import { getCollectionDataQueryDefaultConfig } from "~/lib/constants/config";
import ms from "ms";
import { CandlestickChart } from "lucide-react";
import { HelkinAshi } from "~/components/icons/HelkinAshi";
import { FilterType } from "~/server/api/routers/types";

interface PriceChartProps {
  initialData: TimeData[];
}

export const PriceChart = memo(function PriceChart({
  initialData,
}: PriceChartProps) {
  const [selectedTimeFrame, setSelectedTimeFrame] =
    useState<TimeInterval>(DEFAULT_TIME_FRAME);
  const [chartType, setChartType] = useState<ChartType>(DEFAULT_CHART_TYPE);
  const [filter, setFilter] = useState<FilterType>(DEFAULT_FILTER);

  useEffect(() => {
    const savedChartType = localStorage.getItem("chartType") as ChartType;
    const savedFilter = localStorage.getItem("chartFilter") as FilterType;
    if (savedChartType) {
      setChartType(savedChartType);
    }
    if (savedFilter) {
      setFilter(savedFilter);
    }
  }, []);

  const handleChartTypeChange = (type: ChartType) => {
    setChartType(type);
    localStorage.setItem("chartType", type);
  };

  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter);
    localStorage.setItem("chartFilter", newFilter);
  };

  const { data } = api.collectionData.getLatest.useQuery(
    getCollectionDataQueryDefaultConfig({
      timeInterval: selectedTimeFrame,
      filter,
    }),
    {
      refetchInterval: ms(selectedTimeFrame),
      refetchOnWindowFocus: false,
      staleTime: ms(selectedTimeFrame),
      initialData:
        selectedTimeFrame === DEFAULT_TIME_FRAME && filter === DEFAULT_FILTER
          ? initialData
          : undefined,
    },
  );

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Price Chart</h2>
          <p className="text-muted-foreground">Floor price over time</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex gap-2 border-r pr-4">
            <Button
              variant="outline"
              size="sm"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              data-state={
                chartType === ChartType.REGULAR ? "active" : "inactive"
              }
              onClick={() => handleChartTypeChange(ChartType.REGULAR)}
            >
              <CandlestickChart className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              data-state={
                chartType === ChartType.HEIKIN_ASHI ? "active" : "inactive"
              }
              onClick={() => handleChartTypeChange(ChartType.HEIKIN_ASHI)}
            >
              <HelkinAshi width={28} height={28} />
            </Button>
          </div>

          <div className="flex gap-2 border-r pr-4">
            <Button
              variant="outline"
              size="sm"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              data-state={filter === FilterType.NATIVE ? "active" : "inactive"}
              onClick={() => handleFilterChange(FilterType.NATIVE)}
            >
              TIA
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              data-state={filter === FilterType.USD ? "active" : "inactive"}
              onClick={() => handleFilterChange(FilterType.USD)}
            >
              USD
            </Button>
          </div>

          <div className="flex gap-2">
            {TIME_INTERVAL_OPTIONS.map((tf) => (
              <Button
                key={tf}
                variant="outline"
                size="sm"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                data-state={tf === selectedTimeFrame ? "active" : "inactive"}
                onClick={() => setSelectedTimeFrame(tf)}
              >
                {tf}
              </Button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-green-500">+2.5%</span>
            <span className="text-muted-foreground">24h</span>
          </div>
        </div>
      </div>
      <TradingViewChart
        data={data ?? []}
        timeInterval={selectedTimeFrame}
        chartType={chartType}
      />
    </>
  );
});
