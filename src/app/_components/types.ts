import { type Time } from "lightweight-charts";
import { TimeInterval } from "~/lib/constants/charts";

export type MultiValueTimeData = {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
};

export type SingleValueData = {
  time: Time;
  value: number;
};

export type TimeData = MultiValueTimeData | SingleValueData;

export enum ChartType {
  REGULAR = "Candlestick",
  HEIKIN_ASHI = "Heikin-Ashi",
  LINE = "Line",
}

export interface ChartProps<T extends TimeData> {
  data: T[];
  timeInterval: TimeInterval;
  chartType?: ChartType;
}
