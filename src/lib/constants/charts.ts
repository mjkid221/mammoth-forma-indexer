import ms from "ms";
import { ChartType } from "~/app/_components/types";
import { FilterType } from "~/server/api/routers/types";

export const DEFAULT_TIME_FRAME = "15m";

/**
 * Start time of when indexing started. TODO: change this value dynamically in the future.
 */
export const DEFAULT_START_TIME = 1734752701;
export const DEFAULT_FILTER = FilterType.NATIVE;
export const DEFAULT_CHART_TYPE = ChartType.REGULAR;

export const TIME_INTERVAL_SECONDS = {
  "1w": ms("1w") / 1000,
  "1d": ms("1d") / 1000,
  "4h": ms("4h") / 1000,
  "15m": ms("15m") / 1000,
  "5m": ms("5m") / 1000,
};

export type TimeInterval = keyof typeof TIME_INTERVAL_SECONDS;

export const TIME_INTERVAL_OPTIONS = Object.keys(
  TIME_INTERVAL_SECONDS,
) as TimeInterval[];
