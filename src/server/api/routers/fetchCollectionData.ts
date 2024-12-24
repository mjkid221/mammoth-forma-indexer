import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
  cronAuthMiddleware,
} from "~/server/api/trpc";
import { priceHistory } from "~/server/db/schema";
import { coingeckoApi, coinmarketcapApi, modulariumApi } from "~/lib/api";
import {
  type PriceData,
  type CoinmarketcapPriceData,
  type CoingeckoPriceData,
  FilterType,
} from "./types";
import { type Time } from "lightweight-charts";
import { unstable_cache } from "next/cache";
import { type NextResponse } from "next/server";
import { type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "/Users/mjlee/Documents/Personal/mammoth-indexer/src/server/db/schema";
import {
  TIME_INTERVAL_SECONDS,
  TIME_INTERVAL_OPTIONS,
  type TimeInterval,
} from "~/lib/constants/charts";
import { collectionMaxSupply } from "~/lib/constants/collectionInfo";
import ms from "ms";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function retry<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 1) throw error;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay);
  }
}

async function fetchLatestPriceData(
  ctx: {
    headers: Headers;
    res: NextResponse<unknown>;
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

  const filterQuery = () => {
    if (filter === FilterType.USD) {
      return "priceUsd";
    }
    if (filter === FilterType.LISTING_QTY) {
      return "listingQty";
    }
    if (filter === FilterType.HOLDERS) {
      return "holders";
    }
    return "priceNative";
  };

  const queryFilter = filterQuery();

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
  const rawData = (await query) as (typeof priceHistory.$inferSelect)[];

  rawData.forEach((record) => {
    const intervalTimestamp =
      Math.floor(record.timestamp / intervalInSeconds) * intervalInSeconds;

    const value = Number(record[queryFilter]) || 0;

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

  return Array.from(aggregatedData.entries())
    .map(([timestamp, data]) => ({
      time: timestamp as Time,
      open: data.open,
      high: data.high,
      low: data.low,
      close: data.close,
    }))
    .sort((a, b) => Number(a.time) - Number(b.time));
}

export const collectionDataRouter = createTRPCRouter({
  updatePriceData: publicProcedure
    .use(cronAuthMiddleware)
    .input(
      z.object({
        collectionAddress: z.string(),
        networkName: z.string().transform((network) => network.toLowerCase()),
      }),
    )
    .mutation(async ({ ctx, input: { collectionAddress, networkName } }) => {
      const { data } = await modulariumApi.get<PriceData>(
        `/stats/${collectionAddress}`,
      );

      let tokenPrice: number;

      // Find the latest price in the database
      const databaseQuery = ctx.db.query.priceHistory.findFirst({
        where: (priceHistory, { and, eq }) =>
          and(eq(priceHistory.collectionAddress, collectionAddress)),
        orderBy: (priceHistory, { desc }) => [desc(priceHistory.timestamp)],
      });

      try {
        // Try Coinmarketcap first with retries
        const { data: coinmarketcapData } = await retry(() =>
          coinmarketcapApi.get<CoinmarketcapPriceData>(
            `cryptocurrency/quotes/latest`,
            {
              params: {
                slug: networkName,
              },
            },
          ),
        );

        const tokenData =
          coinmarketcapData.data[Object.keys(coinmarketcapData.data)[0]!]!;
        tokenPrice = Number(tokenData.quote.USD.price.toPrecision(2));
      } catch (error) {
        // Fallback to Coingecko with retries if Coinmarketcap fails
        console.log(error);
        console.log(
          "Coinmarketcap API failed after retries, falling back to Coingecko",
        );
        const { data: coingeckoData } = await retry(() =>
          coingeckoApi.get<CoingeckoPriceData>(`/coins/${networkName}`),
        );
        tokenPrice = Number(
          coingeckoData.market_data.current_price.usd.toPrecision(2),
        );
      }

      const tokenPriceNative = data.floorPrice;
      const currentVolumeNativeToken = data.totalSalesVolume;
      const latestPriceEntry = await databaseQuery;
      const latestTotalVolumeNativeToken =
        Number(latestPriceEntry?.totalVolumeNativeToken) ?? 0;

      const tokenPriceUsd = tokenPriceNative * tokenPrice;
      const trueVolumeNativeToken =
        currentVolumeNativeToken - latestTotalVolumeNativeToken;
      const trueVolumeUsd = trueVolumeNativeToken * tokenPrice;

      await ctx.db.insert(priceHistory).values({
        collectionAddress,
        timestamp: Math.floor(Date.now() / 1000),
        priceNative: tokenPriceNative.toString(),
        priceUsd: tokenPriceUsd.toString(),
        nativeToken: networkName,
        holders: data.holders,
        listingQty: data.numListed,
        volumeNativeToken: trueVolumeNativeToken.toString(),
        volumeUsd: trueVolumeUsd.toString(),
        totalVolumeNativeToken: currentVolumeNativeToken.toString(),
      });

      return { success: true };
    }),

  getLatest: publicProcedure
    .input(
      z.object({
        collectionAddress: z.string(),
        startTime: z.number().optional(),
        endTime: z.number().optional(),
        filter: z.nativeEnum(FilterType),
        timeInterval: z
          .enum(TIME_INTERVAL_OPTIONS as [string, ...string[]])
          .transform((timeInterval) => timeInterval as TimeInterval),
      }),
    )
    .query(({ ctx, input }) => {
      return unstable_cache(
        () => fetchLatestPriceData(ctx, input),
        [
          `price-history-${input.collectionAddress}-${input.timeInterval}-${input.filter}`,
        ],
        {
          revalidate: 300, // Cache for 5 minutes
        },
      )();
    }),

  getCollectionData: publicProcedure
    .input(
      z.object({
        collectionAddress: z.string(),
      }),
    )
    .query(async ({ ctx, input: { collectionAddress } }) => {
      return unstable_cache(
        async () => {
          // Get data from the last 24 hours
          const oneDayAgo = Math.floor(Date.now() / 1000) - ms("1d") / 1000;
          console.log(oneDayAgo);

          const query = await ctx.db.query.priceHistory.findMany({
            where: (priceHistory, { and, eq, gte }) =>
              and(
                eq(priceHistory.collectionAddress, collectionAddress),
                gte(priceHistory.timestamp, oneDayAgo),
              ),
            orderBy: (priceHistory, { desc }) => [desc(priceHistory.timestamp)],
          });

          // Get the latest entry (first in the array since we ordered by desc)
          const latestEntry = query[0];

          // Calculate total 24hr volume by summing all volume entries
          const volume24hNative = query.reduce(
            (sum, entry) => sum + Number(entry.volumeNativeToken ?? 0),
            0,
          );
          const volume24hUsd = query.reduce(
            (sum, entry) => sum + Number(entry.volumeUsd ?? 0),
            0,
          );

          const holders = Number(latestEntry?.holders ?? 0);
          const numListed = Number(latestEntry?.listingQty ?? 0);
          const floorPriceNative = Number(latestEntry?.priceNative ?? 0);
          const floorPriceUsd = Number(latestEntry?.priceUsd ?? 0);
          const marketCapNative = floorPriceNative * collectionMaxSupply;
          const marketCapUsd = floorPriceUsd * collectionMaxSupply;

          return {
            holders,
            numListed,
            floorPriceNative,
            floorPriceUsd,
            marketCapNative,
            marketCapUsd,
            volume24hNative,
            volume24hUsd,
          };
        },
        [`collection-data-${collectionAddress}`],
        {
          revalidate: 300, // Cache for 5 minutes
        },
      )();
    }),
});
