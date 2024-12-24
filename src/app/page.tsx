import { Users, TrendingUp, Volume2, ChartArea } from "lucide-react";
import { Card } from "~/components/ui/card";
import { TradingViewChart } from "./_components/TradingViewChart";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@radix-ui/react-tabs";
import { api } from "~/trpc/server";
import { env } from "~/env";

import { PriceChart } from "./_components/PriceChart";
import { DEFAULT_TIME_FRAME } from "~/lib/constants/charts";
import {
  getCollectionAddress,
  getCollectionDataQueryDefaultConfig,
} from "~/lib/constants/config";
import { FilterType } from "~/server/api/routers/types";
import { formatCurrency, formatNumber } from "~/lib/utils/currency";

const projectName = env.NEXT_PUBLIC_PROJECT_NAME;
const nativeCurrency = env.NEXT_PUBLIC_NATIVE_CURRENCY;
export default async function Home() {
  const {
    floorPriceNative,
    floorPriceUsd,
    marketCapNative,
    marketCapUsd,
    volume24hNative,
    volume24hUsd,
    holders,
    numListed,
  } = await api.collectionData.getCollectionData(getCollectionAddress());
  const priceData = await api.collectionData.getLatest(
    getCollectionDataQueryDefaultConfig({
      timeInterval: DEFAULT_TIME_FRAME,
      filter: FilterType.NATIVE,
    }),
  );

  return (
    <main className="container mx-auto space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">{projectName}</h1>
          <p className="text-muted-foreground">
            Floor Price: {floorPriceNative} {nativeCurrency}{" "}
            <span className="text-[12px]">
              ({formatCurrency(floorPriceUsd)})
            </span>
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <ChartArea className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">24h Volume</p>
                <p className="text-xl font-bold">
                  {formatNumber(volume24hNative)} {nativeCurrency}
                  <span className="text-[12px] text-muted-foreground">
                    {" "}
                    ({formatCurrency(volume24hUsd)})
                  </span>
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Listed/Holders</p>
                <p className="text-xl font-bold">
                  {numListed}/{holders}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Market Cap</p>
                <p className="text-xl font-bold">
                  {formatNumber(marketCapNative)} {nativeCurrency}
                  <span className="text-[12px] text-muted-foreground">
                    {" "}
                    ({formatCurrency(marketCapUsd)})
                  </span>
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Card className="p-6">
        <Tabs defaultValue="price" className="space-y-4">
          <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
            <TabsTrigger
              className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              value="price"
            >
              Price
            </TabsTrigger>
            <TabsTrigger
              className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              value="volume"
            >
              Volume
            </TabsTrigger>
            <TabsTrigger
              className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              value="listings"
            >
              Listings
            </TabsTrigger>
            <TabsTrigger
              className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              value="holders"
            >
              Holders
            </TabsTrigger>
          </TabsList>
          <TabsContent value="price" className="space-y-4">
            <PriceChart initialData={priceData} />
          </TabsContent>
          <TabsContent value="volume">
            <TradingViewChart
              data={priceData}
              timeInterval={DEFAULT_TIME_FRAME}
            />
          </TabsContent>
          <TabsContent value="sales">
            <TradingViewChart
              data={priceData}
              timeInterval={DEFAULT_TIME_FRAME}
            />
          </TabsContent>
        </Tabs>
      </Card>
    </main>
  );
}
