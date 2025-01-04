import { type priceHistory } from "~/server/db/schema";
import { type TimeframeData } from "../types";

export function calculatePercentageChange(
  current: number,
  previous: number,
): number {
  return previous ? ((current - previous) / previous) * 100 : 0;
}

export function getMetricsForTimeframe(
  entries: (typeof priceHistory.$inferSelect)[],
): TimeframeData["current"] {
  const latest = entries[0] ?? {
    priceNative: "0",
    priceUsd: "0",
    volumeNativeToken: "0",
    volumeUsd: "0",
    listingQty: "0",
    holders: "0",
  };

  return {
    priceNative: Number(latest.priceNative),
    priceUsd: Number(latest.priceUsd),
    volumeUsd: Number(latest.volumeUsd),
    volumeNativeToken: Number(latest.volumeNativeToken),
    listingQty: Number(latest.listingQty),
    holders: Number(latest.holders),
  };
}
