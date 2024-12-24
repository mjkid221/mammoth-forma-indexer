"use client";

import { memo, useMemo, useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { TradingViewChart } from "./TradingViewChart";
import { ChartType, MultiValueTimeData, type TimeData } from "./types";
import { BaseChart } from "./BaseChart";
import {
  DEFAULT_CHART_TYPE,
  DEFAULT_FILTER,
  DEFAULT_TIME_FRAME,
  TimeInterval,
} from "~/lib/constants/charts";
import { api } from "~/trpc/react";
import { getCollectionDataQueryDefaultConfig } from "~/lib/constants/config";
import ms from "ms";
import { CandlestickChart } from "lucide-react";
import { HelkinAshi } from "~/components/icons/HelkinAshi";
import { FilterType } from "~/server/api/routers/types";
import { usePersistingRootStore } from "~/lib/stores/root";
import {
  generateChartTypeKey,
  generateFilterKey,
} from "~/lib/constants/storageKey";
import { useMountedState } from "~/lib/hooks/useMountedState";

interface PriceChartProps {
  initialData?: TimeData[];
}

const CHART_TYPE_KEY = generateChartTypeKey("price");
const FILTER_KEY = generateFilterKey("price");

export const PriceChart = memo(function PriceChart({
  initialData,
}: PriceChartProps) {
  const { configuration, setConfiguration } = usePersistingRootStore();
  const { getMountedStateClasses } = useMountedState();

  const chartType = useMemo(
    () => (configuration[CHART_TYPE_KEY] as ChartType) ?? DEFAULT_CHART_TYPE,
    [configuration],
  );
  const filter = useMemo(
    () => (configuration[FILTER_KEY] as FilterType) ?? DEFAULT_FILTER,
    [configuration],
  );

  const handleChartTypeChange = (type: ChartType) => {
    setConfiguration({ [CHART_TYPE_KEY]: type });
  };

  const handleFilterChange = (newFilter: FilterType) => {
    setConfiguration({ [FILTER_KEY]: newFilter });
  };

  const renderChart = (timeInterval: TimeInterval) => {
    const { data, isLoading } = api.collectionData.getLatest.useQuery<
      MultiValueTimeData[]
    >(
      getCollectionDataQueryDefaultConfig({
        timeInterval,
        filter,
      }),
      {
        refetchInterval: ms(timeInterval),
        refetchOnWindowFocus: false,
        staleTime: ms(timeInterval),
        initialData:
          timeInterval === DEFAULT_TIME_FRAME && filter === DEFAULT_FILTER
            ? initialData
            : undefined,
      },
    );

    return (
      <TradingViewChart<MultiValueTimeData>
        data={data ?? []}
        timeInterval={timeInterval}
        chartType={chartType}
        isLoading={isLoading}
      />
    );
  };

  const chartControls = useMemo(() => {
    return (
      <>
        <div className="flex gap-2 border-r pr-4">
          <Button
            variant="outline"
            size="sm"
            className={getMountedStateClasses(
              "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
            )}
            data-state={chartType === ChartType.REGULAR ? "active" : "inactive"}
            onClick={() => handleChartTypeChange(ChartType.REGULAR)}
          >
            <CandlestickChart className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={getMountedStateClasses(
              "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
            )}
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
            className={getMountedStateClasses(
              "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
            )}
            data-state={filter === FilterType.NATIVE ? "active" : "inactive"}
            onClick={() => handleFilterChange(FilterType.NATIVE)}
          >
            TIA
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={getMountedStateClasses(
              "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
            )}
            data-state={filter === FilterType.USD ? "active" : "inactive"}
            onClick={() => handleFilterChange(FilterType.USD)}
          >
            USD
          </Button>
        </div>
      </>
    );
  }, [chartType, filter, getMountedStateClasses]);

  return (
    <BaseChart
      filterKey={filter}
      title="Price Chart"
      subtitle="Floor price over time"
      renderChart={renderChart}
    >
      {chartControls}
    </BaseChart>
  );
});
