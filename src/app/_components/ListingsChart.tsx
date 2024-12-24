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

export const ListingsChart = memo(function ListingsChart() {
  const [chartType] = useState<ChartType>(ChartType.LINE);
  const [filter] = useState<FilterType>(FilterType.LISTING_QTY);

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
      title="Listings Chart"
      subtitle="Listings over time"
      renderChart={renderChart}
    >
      {chartControls}
    </BaseChart>
  );
});
