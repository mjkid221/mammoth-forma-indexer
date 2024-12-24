import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { FilterType } from "../types";
import { TIME_INTERVAL_SECONDS, TimeInterval } from "~/lib/constants/charts";
import { Time } from "lightweight-charts";
import { TimeData } from "~/app/_components/types";
import * as schema from "~/server/db/schema";

const singleValueFilters = [
  FilterType.HOLDERS,
  FilterType.LISTING_QTY,
  FilterType.VOLUME_NATIVE,
  FilterType.VOLUME_USD,
];

/**
 * Aggregates price data by time interval and returns the data in the format of TimeData based on filter query.
 * @param ctx - The context object containing the database connection.
 * @param input - The input object containing the collection address, start time, end time, filter, and time interval.
 * @returns The aggregated price data in the format of TimeData.
 */
export async function fetchLatestPriceData(
  ctx: {
    headers: Headers;
    db: PostgresJsDatabase<typeof schema>;
  },
  input: {
    collectionAddress: string;
    startTime?: number;
    endTime?: number;
    filter: FilterType;
    timeInterval: TimeInterval;
  },
) {
  const { collectionAddress, startTime, endTime, filter, timeInterval } = input;
  const intervalInSeconds = TIME_INTERVAL_SECONDS[timeInterval];
  const queryFilter = filter ?? FilterType.NATIVE;

  const query = ctx.db.query.priceHistory.findMany({
    columns: {
      [queryFilter]: true,
      timestamp: true,
    },
    where: (priceHistory, { and, gte, lte, eq }) => {
      const conditions = [
        eq(priceHistory.collectionAddress, collectionAddress),
        startTime ? gte(priceHistory.timestamp, startTime) : undefined,
        endTime ? lte(priceHistory.timestamp, endTime) : undefined,
      ].filter(Boolean);
      return and(...conditions);
    },
    orderBy: (priceHistory, { asc }) => [asc(priceHistory.timestamp)],
  });

  // Group and aggregate data by time interval
  const aggregatedData = new Map<
    number,
    { open: number; high: number; low: number; close: number; prices: number[] }
  >();
  const rawData = (await query) as (typeof schema.priceHistory.$inferSelect)[];

  rawData.forEach((record) => {
    const intervalTimestamp =
      Math.floor(record.timestamp / intervalInSeconds) * intervalInSeconds;

    const value = Number(record[queryFilter]) ?? 0;

    if (!aggregatedData.has(intervalTimestamp)) {
      aggregatedData.set(intervalTimestamp, {
        open: value,
        high: value,
        low: value,
        close: value,
        prices: [value],
      });
    } else {
      const current = aggregatedData.get(intervalTimestamp)!;
      current.high = Math.max(current.high, value);
      current.low = Math.min(current.low, value);
      current.close = value; // Last value in the interval
      current.prices.push(value);
      aggregatedData.set(intervalTimestamp, current);
    }
  });

  // Format data based on filter type
  return Array.from(aggregatedData.entries())
    .map(([timestamp, data]) => {
      if (singleValueFilters.includes(input.filter)) {
        return {
          time: timestamp as Time,
          value: data.close, // Use close value for single value filters
        };
      }
      return {
        time: timestamp as Time,
        open: data.open,
        high: data.high,
        low: data.low,
        close: data.close,
      };
    })
    .sort((a, b) => Number(a.time) - Number(b.time)) as TimeData[];
}
