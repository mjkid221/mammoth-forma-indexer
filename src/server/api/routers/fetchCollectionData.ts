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
  updatePriceData: protectedProcedure
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
      const tokenPriceUsd = tokenPriceNative * tokenPrice;
      await ctx.db.insert(priceHistory).values({
        collectionAddress,
        timestamp: Math.floor(Date.now() / 1000),
        priceNative: tokenPriceNative.toString(),
        priceUsd: tokenPriceUsd.toString(),
        nativeToken: networkName,
      });

      return { success: true };
    }),

  // getLatest: publicProcedure.query(async ({ ctx }) => {
  //   const post = await ctx.db.query.posts.findFirst({
  //     orderBy: (posts, { desc }) => [desc(posts.createdAt)],
  //   });

  //   return post ?? null;
  // }),
  getCollectionData: publicProcedure
    .input(
      z.object({
        collectionAddress: z.string(),
      }),
    )
    .query(async ({ input: { collectionAddress } }) => {
      const { data } = await axios.get<PriceData>(
        `https://api.modularium.art/stats/${collectionAddress}`,
      );
      console.log(data);
      return data;
    }),
});
