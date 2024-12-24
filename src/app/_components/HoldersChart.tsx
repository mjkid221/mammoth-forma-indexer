"use client";

import { useState, memo } from "react";
import { TradingViewChart } from "./TradingViewChart";
import { BaseChartProps, ChartType, SingleValueData } from "./types";
import { BaseChart } from "./BaseChart";
import { TimeInterval } from "~/lib/constants/charts";
import { api } from "~/trpc/react";
import { getCollectionDataQueryDefaultConfig } from "~/lib/constants/config";
import ms from "ms";
import { FilterType, MetricChanges } from "~/server/api/routers/types";

interface HoldersChartProps extends BaseChartProps {}

export const HoldersChart = memo(function HoldersChart({}: HoldersChartProps) {
  const [chartType] = useState<ChartType>(ChartType.LINE);
  const [filter] = useState<FilterType>(FilterType.HOLDERS);

  const renderChart = (timeInterval: TimeInterval) => {
    const { data, isLoading } = api.collectionData.getLatest.useQuery<
      SingleValueData[]
    >(
      getCollectionDataQueryDefaultConfig({
        timeInterval,
        filter,
      }),
      {
        refetchInterval: ms(timeInterval),
        refetchOnWindowFocus: false,
        staleTime: ms(timeInterval),
      },
    );

    return (
      <TradingViewChart<SingleValueData>
        data={data ?? []}
        timeInterval={timeInterval}
        chartType={chartType}
        isLoading={isLoading}
      />
    );
  };

  const chartControls = null;

  return (
    <BaseChart
      filterKey={filter}
      title="Holders Chart"
      subtitle="Holders over time"
      renderChart={renderChart}
    >
      {chartControls}
    </BaseChart>
  );
});
