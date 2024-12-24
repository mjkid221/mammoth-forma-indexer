"use client";

import { useState, useEffect, memo, type ReactNode } from "react";
import { Button } from "~/components/ui/button";
import {
  TimeInterval,
  TIME_INTERVAL_OPTIONS,
  DEFAULT_TIME_FRAME,
} from "~/lib/constants/charts";

interface BaseChartProps {
  title: string;
  subtitle: string;
  children?: ReactNode;
  rightHeaderContent?: ReactNode;
  renderChart: (timeInterval: TimeInterval) => ReactNode;
  initialTimeFrame?: TimeInterval;
}

export const BaseChart = memo(function BaseChart({
  title,
  subtitle,
  children,
  rightHeaderContent,
  renderChart,
  initialTimeFrame = DEFAULT_TIME_FRAME,
}: BaseChartProps) {
  const [selectedTimeFrame, setSelectedTimeFrame] =
    useState<TimeInterval>(initialTimeFrame);

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex items-center space-x-4">
          {children}

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

          {rightHeaderContent}
        </div>
      </div>
      {renderChart(selectedTimeFrame)}
    </>
  );
});
