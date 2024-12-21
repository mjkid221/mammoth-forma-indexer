import axios from "axios";

export const modulariumApi = axios.create({
  baseURL: "https://api.modularium.art",
});

export const coinmarketcapApi = axios.create({
  baseURL: "https://pro-api.coinmarketcap.com/v2",
  headers: {
    "X-CMC_PRO_API_KEY": process.env.COINMARKETCAP_API_KEY,
  },
});

export const coingeckoApi = axios.create({
  baseURL: "https://api.coingecko.com/api/v3",
  headers: {
    "x-cg-demo-api-key": process.env.COINGECKO_API_KEY,
  },
});
