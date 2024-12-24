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

export type CmcQuote = {
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

/**
 * FilterType is used to specify the type of data to filter by.
 * Make sure this matches the column name in the database.
 */
export enum FilterType {
  NATIVE = "priceNative",
  USD = "priceUsd",
  LISTING_QTY = "listingQty",
  HOLDERS = "holders",
  VOLUME_NATIVE = "volumeNativeToken",
  VOLUME_USD = "volumeUsd",
}

export type MetricChanges = Record<FilterType, number>;

export type TimeframeData = {
  current: MetricChanges;
  changes: Record<string, MetricChanges>;
};
