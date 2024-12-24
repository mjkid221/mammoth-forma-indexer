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

export enum FilterType {
  NATIVE = "nativeToken",
  USD = "priceUsd",
  LISTING_QTY = "listingQty",
  HOLDERS = "holders",
}
