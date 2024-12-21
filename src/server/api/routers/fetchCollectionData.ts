import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  cronAuthMiddleware,
} from "~/server/api/trpc";
import { priceHistory } from "~/server/db/schema";
import axios from "axios";
import { coingeckoApi, coinmarketcapApi } from "~/lib/api";
import {
  type PriceData,
  type CoinmarketcapPriceData,
  type CoingeckoPriceData,
} from "./types";
import { type Time } from "lightweight-charts";

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
      const { data } = await axios.get<PriceData>(
        `https://api.modularium.art/stats/${collectionAddress}`,
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

      const tokenPriceNative = data.avgSalePrice;
      const currentVolumeNativeToken = data.totalSalesVolume;
      const latestPriceEntry = await databaseQuery;
      const latestVolumeNativeToken =
        Number(latestPriceEntry?.volumeNativeToken) ?? 0;

      const tokenPriceUsd = tokenPriceNative * tokenPrice;
      const trueVolumeNativeToken =
        currentVolumeNativeToken - latestVolumeNativeToken;
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
      });

      return { success: true };
    }),

  getLatest: publicProcedure
    .input(
      z.object({
        collectionAddress: z.string(),
        startTime: z.number().optional(), // unix timestamp
        endTime: z.number().optional(), // unix timestamp
        priceType: z.enum(["native", "usd"]),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { collectionAddress, startTime, endTime, priceType } = input;

      const query = ctx.db.query.priceHistory.findMany({
        where: (priceHistory, { and, gte, lte, eq }) => {
          const conditions = [
            eq(priceHistory.collectionAddress, collectionAddress),
          ];

          if (startTime) {
            conditions.push(gte(priceHistory.timestamp, startTime));
          }
          if (endTime) {
            conditions.push(lte(priceHistory.timestamp, endTime));
          }

          return and(...conditions);
        },
        orderBy: (priceHistory, { asc }) => [asc(priceHistory.timestamp)],
      });

      const data = await query;

      // Transform data for TradingView chart
      return data.map((record) => ({
        time: record.timestamp as Time,
        value:
          Number(
            priceType === "native" ? record.priceNative : record.priceUsd,
          ) || 0,
      }));
    }),

  getCollectionData: protectedProcedure
    .input(
      z.object({
        collectionAddress: z.string(),
      }),
    )
    .query(async ({ input: { collectionAddress } }) => {
      const { data } = await axios.get<PriceData>(
        `https://api.modularium.art/stats/${collectionAddress}`,
      );
      return data;
    }),
});
