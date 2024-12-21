"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { TradingViewChart } from "./TradingViewChart";
import { type Time } from "lightweight-charts";
import { type TimeData } from "./types";
import { DEFAULT_TIME_FRAME } from "~/lib/constants/charts";

type TimeInterval = "1w" | "1d" | "4h" | "15m" | "10m" | "5m";

interface PriceChartProps {
  initialData: {
    time: Time;
    value: number;
  }[];
  onTimeFrameChange: (timeFrame: TimeInterval) => Promise<TimeData[]>;
}

export function PriceChart({
  initialData,
  onTimeFrameChange,
}: PriceChartProps) {
  const timeFrames: TimeInterval[] = ["1w", "1d", "4h", "15m", "10m", "5m"];
  const [selectedTimeFrame, setSelectedTimeFrame] =
    useState<TimeInterval>(DEFAULT_TIME_FRAME);
  const [data, setData] = useState(initialData);

  const handleTimeFrameChange = async (timeFrame: TimeInterval) => {
    setSelectedTimeFrame(timeFrame);
    const newData = await onTimeFrameChange(timeFrame);
    setData(newData);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Price Chart</h2>
          <p className="text-muted-foreground">Floor price over time</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex gap-2">
            {timeFrames.map((tf) => (
              <Button
                key={tf}
                variant="outline"
                size="sm"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                data-state={tf === selectedTimeFrame ? "active" : "inactive"}
                onClick={() => handleTimeFrameChange(tf)}
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
      <TradingViewChart data={data} timeInterval={selectedTimeFrame} />
    </>
  );
}
