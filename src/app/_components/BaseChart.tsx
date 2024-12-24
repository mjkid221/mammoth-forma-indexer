"use client";

import ms from "ms";
import { memo, type ReactNode, useMemo, useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  TimeInterval,
  TIME_INTERVAL_OPTIONS,
  DEFAULT_TIME_FRAME,
} from "~/lib/constants/charts";
import { getCollectionAddress } from "~/lib/constants/config";
import { generateTimeFrameKey } from "~/lib/constants/storageKey";
import { usePersistingRootStore } from "~/lib/stores/root";
import { FilterType } from "~/server/api/routers/types";
import { api } from "~/trpc/react";
import { useMountedState } from "~/lib/hooks/useMountedState";
import { motion } from "framer-motion";

interface BaseChartProps {
  filterKey: FilterType;
  title: string;
  subtitle: string;
  children?: ReactNode;
  renderChart: (timeInterval: TimeInterval) => ReactNode;
  initialTimeFrame?: TimeInterval;
}

const RightHeaderContent = ({
  percentageChange,
  timeInterval,
}: {
  percentageChange: number;
  timeInterval: TimeInterval;
}) => (
  <div className="flex items-center rounded-md bg-muted/50">
    <div
      className={`flex h-8 min-w-[90px] items-center justify-end rounded-sm border px-3 text-sm font-medium ${
        percentageChange > 0
          ? "text-green-500"
          : percentageChange < 0
            ? "text-red-500"
            : "text-muted-foreground"
      }`}
    >
      {percentageChange > 0 ? "+" : ""}
      {percentageChange.toFixed(2)}%
    </div>
    <div className="ml-2 flex h-8 min-w-[64px] items-center justify-center rounded-sm border px-3 text-sm font-medium">
      {timeInterval}
    </div>
  </div>
);

export const BaseChart = memo(function BaseChart({
  filterKey,
  title,
  subtitle,
  children,
  renderChart,
  initialTimeFrame = DEFAULT_TIME_FRAME,
}: BaseChartProps) {
  const { configuration, setConfiguration } = usePersistingRootStore();
  const { getMountedStateClasses } = useMountedState();

  const selectedTimeFrame = useMemo(
    () =>
      (configuration[generateTimeFrameKey(title)] as TimeInterval) ??
      initialTimeFrame,
    [configuration, initialTimeFrame, title],
  );

  const handleTimeFrameChange = (timeFrame: TimeInterval) => {
    setConfiguration({ [generateTimeFrameKey(title)]: timeFrame });
  };

  const { data } = api.collectionData.getCollectionData.useQuery(
    getCollectionAddress(),
    {
      refetchInterval: ms("5m"),
      staleTime: ms("5m"),
      refetchOnWindowFocus: false,
    },
  );
  const percentageChanges = useMemo(() => {
    if (!data) return undefined;
    const { percentageChanges } = data;
    return percentageChanges[selectedTimeFrame]?.[filterKey] ?? 0;
  }, [data, selectedTimeFrame, filterKey]);

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="flex items-center gap-4">{children}</div>
          </motion.div>
          <div className="flex flex-wrap gap-2 border-r pr-4">
            {TIME_INTERVAL_OPTIONS.map((tf) => (
              <Button
                key={tf}
                variant="outline"
                size="sm"
                className={getMountedStateClasses(
                  "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                )}
                data-state={tf === selectedTimeFrame ? "active" : "inactive"}
                onClick={() => handleTimeFrameChange(tf)}
              >
                {tf}
              </Button>
            ))}
          </div>
          <RightHeaderContent
            percentageChange={Number(percentageChanges ?? 0)}
            timeInterval={selectedTimeFrame}
          />
        </div>
      </div>
      {renderChart(selectedTimeFrame)}
    </>
  );
});
