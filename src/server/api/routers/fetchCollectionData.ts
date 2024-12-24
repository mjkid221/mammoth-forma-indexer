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
  MetricChanges,
} from "./types";
import { unstable_cache } from "next/cache";
import {
  TIME_INTERVAL_SECONDS,
  TIME_INTERVAL_OPTIONS,
  type TimeInterval,
} from "~/lib/constants/charts";
import { collectionMaxSupply } from "~/lib/constants/collectionInfo";
import ms from "ms";
import { retry } from "./helpers/retry";
import { fetchLatestPriceData } from "./helpers/priceAggregation";
import {
  calculatePercentageChange,
  getMetricsForTimeframe,
} from "./helpers/percentageChange";

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
          const currentTime = Math.floor(Date.now() / 1000);
          const oneDayAgo = currentTime - ms("1d") / 1000;

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

          const current = getMetricsForTimeframe(query);
          const changes: Record<string, MetricChanges> = {};

          const holders = Number(latestEntry?.holders ?? 0);
          const numListed = Number(latestEntry?.listingQty ?? 0);
          const floorPriceNative = Number(latestEntry?.priceNative ?? 0);
          const floorPriceUsd = Number(latestEntry?.priceUsd ?? 0);
          const marketCapNative = floorPriceNative * collectionMaxSupply;
          const marketCapUsd = floorPriceUsd * collectionMaxSupply;

          const latestTime = query[0]?.timestamp ?? currentTime;
          // Calculate changes for each timeframe
          for (const [timeframe, seconds] of Object.entries(
            TIME_INTERVAL_SECONDS,
          )) {
            const timeframeData = query.filter(
              (entry) => entry.timestamp >= latestTime - seconds,
            );
            const oldestInTimeframe = getMetricsForTimeframe(
              timeframeData.slice(-1),
            );

            changes[timeframe] = {
              priceNative: calculatePercentageChange(
                current.priceNative,
                oldestInTimeframe.priceNative,
              ),
              priceUsd: calculatePercentageChange(
                current.priceUsd,
                oldestInTimeframe.priceUsd,
              ),
              volumeUsd: calculatePercentageChange(
                current.volumeUsd,
                oldestInTimeframe.volumeUsd,
              ),
              volumeNativeToken: calculatePercentageChange(
                current.volumeNativeToken,
                oldestInTimeframe.volumeNativeToken,
              ),
              listingQty: calculatePercentageChange(
                current.listingQty,
                oldestInTimeframe.listingQty,
              ),
              holders: calculatePercentageChange(
                current.holders,
                oldestInTimeframe.holders,
              ),
            };
          }

          return {
            holders,
            numListed,
            floorPriceNative,
            floorPriceUsd,
            marketCapNative,
            marketCapUsd,
            volume24hNative,
            volume24hUsd,
            percentageChanges: changes,
          };
        },
        [`collection-data-${collectionAddress}`],
        {
          revalidate: 300, // Cache for 5 minutes
        },
      )();
    }),
});
