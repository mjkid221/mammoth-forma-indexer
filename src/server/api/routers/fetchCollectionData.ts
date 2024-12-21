import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { priceHistory } from "~/server/db/schema";
import axios from "axios";
import { coingeckoApi, coinmarketcapApi } from "~/lib/api";

export type PriceData = {
  numMinted: number;
  primaryVolume: number;
  totalSalesQty: number;
  totalSalesVolume: number;
  maxSalePrice: number;
  minSalePrice: number;
  avgSalePrice: number;
  floorPrice: number;
  numListed: number;
  holders: number;
};

type CmcQuote = {
  quote: {
    USD: {
      price: number;
    };
  };
};
export type CoinmarketcapPriceData = {
  data: Record<string, CmcQuote>;
};

export type CoingeckoPriceData = {
  market_data: {
    current_price: {
      usd: number;
    };
  };
};

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
  getPriceData: publicProcedure.query(async ({ ctx }) => {
    const { data } = await axios.get<PriceData>(
      `https://api.modularium.art/stats/0xbE25A97896b9CE164a314C70520A4df55979a0c6`,
    );
    console.log(data);
    return data;
  }),
});
