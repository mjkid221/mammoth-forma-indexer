"use client";

import { useState, memo } from "react";
import { TradingViewChart } from "./TradingViewChart";
import { ChartType, SingleValueData } from "./types";
import { BaseChart } from "./BaseChart";
import { TimeInterval } from "~/lib/constants/charts";
import { api } from "~/trpc/react";
import { getCollectionDataQueryDefaultConfig } from "~/lib/constants/config";
import ms from "ms";
import { FilterType } from "~/server/api/routers/types";

export const HoldersChart = memo(function HoldersChart() {
  const [chartType] = useState<ChartType>(ChartType.LINE);
  const [filter] = useState<FilterType>(FilterType.HOLDERS);

  const renderChart = (timeInterval: TimeInterval) => {
    const { data } = api.collectionData.getLatest.useQuery<SingleValueData[]>(
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
      />
    );
  };

  const chartControls = null;
  const rightHeaderContent = (
    <div className="flex items-center space-x-2">
      <span className="text-2xl font-bold text-green-500">+2.5%</span>
      <span className="text-muted-foreground">24h</span>
    </div>
  );

  return (
    <BaseChart
      title="Holders Chart"
      subtitle="Holders over time"
      renderChart={renderChart}
      rightHeaderContent={rightHeaderContent}
    >
      {chartControls}
    </BaseChart>
  );
});
