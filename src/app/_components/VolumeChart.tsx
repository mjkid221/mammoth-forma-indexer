"use client";

import { memo, useMemo } from "react";
import { Button } from "~/components/ui/button";
import { TradingViewChart } from "./TradingViewChart";
import { ChartType, SingleValueData } from "./types";
import { BaseChart } from "./BaseChart";
import { TimeInterval } from "~/lib/constants/charts";
import { api } from "~/trpc/react";
import { getCollectionDataQueryDefaultConfig } from "~/lib/constants/config";
import ms from "ms";
import { FilterType } from "~/server/api/routers/types";
import { nativeCurrency } from "~/lib/constants/collectionInfo";
import {
  generateChartTypeKey,
  generateFilterKey,
} from "~/lib/constants/storageKey";
import { usePersistingRootStore } from "~/lib/stores/root";

const CHART_TYPE_KEY = generateChartTypeKey("volume");
const FILTER_KEY = generateFilterKey("volume");

export const VolumeChart = memo(function VolumeChart() {
  const { configuration, setConfiguration } = usePersistingRootStore();
  const chartType = useMemo(
    () => (configuration[CHART_TYPE_KEY] as ChartType) ?? ChartType.AREA,
    [configuration],
  );
  const filter = useMemo(
    () => (configuration[FILTER_KEY] as FilterType) ?? FilterType.VOLUME_NATIVE,
    [configuration],
  );

  const handleFilterChange = (newFilter: FilterType) => {
    setConfiguration({ [FILTER_KEY]: newFilter });
  };

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

  const chartControls = useMemo(() => {
    return (
      <>
        <div className="flex gap-2 border-r pr-4">
          <Button
            variant="outline"
            size="sm"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            data-state={
              filter === FilterType.VOLUME_NATIVE ? "active" : "inactive"
            }
            onClick={() => handleFilterChange(FilterType.VOLUME_NATIVE)}
          >
            {nativeCurrency}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            data-state={
              filter === FilterType.VOLUME_USD ? "active" : "inactive"
            }
            onClick={() => handleFilterChange(FilterType.VOLUME_USD)}
          >
            USD
          </Button>
        </div>
      </>
    );
  }, [filter]);

  return (
    <BaseChart
      filterKey={filter}
      title="Volume Chart"
      subtitle="Volume over time"
      renderChart={renderChart}
    >
      {chartControls}
    </BaseChart>
  );
});
