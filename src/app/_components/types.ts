import { type Time } from "lightweight-charts";
import { TimeInterval } from "~/lib/constants/charts";

export type TimeData = {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
};

export enum ChartType {
  REGULAR = "Regular",
  HEIKIN_ASHI = "Heikin-Ashi",
}

export interface ChartProps {
  data: TimeData[];
  timeInterval: TimeInterval;
  chartType?: ChartType;
}
