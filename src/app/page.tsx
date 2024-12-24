import { Users, TrendingUp, ChartArea } from "lucide-react";
import { Card } from "~/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@radix-ui/react-tabs";
import { api } from "~/trpc/server";

import { PriceChart } from "./_components/PriceChart";
import { DEFAULT_TIME_FRAME } from "~/lib/constants/charts";
import {
  getCollectionAddress,
  getCollectionDataQueryDefaultConfig,
} from "~/lib/constants/config";
import { FilterType } from "~/server/api/routers/types";
import { formatCurrency, formatNumber } from "~/lib/utils/currency";
import { HoldersChart } from "./_components/HoldersChart";
import { ListingsChart } from "./_components/ListingsChart";
import { nativeCurrency, projectName } from "~/lib/constants/collectionInfo";
import { VolumeChart } from "./_components/VolumeChart";
import { GithubRepoLink } from "./_components/github";

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

  const TABS = [
    {
      label: "Price",
      component: <PriceChart initialData={priceData} />,
    },
    {
      label: "Volume",
      component: <VolumeChart />,
    },
    {
      label: "Listings",
      component: <ListingsChart />,
    },
    {
      label: "Holders",
      component: <HoldersChart />,
    },
  ];

  return (
    <main className="container mx-auto space-y-4 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-4xl font-bold">{projectName}</h1>
          <p className="text-muted-foreground">
            Floor Price: {floorPriceNative} {nativeCurrency}{" "}
            <span className="text-[12px]">
              ({formatCurrency(floorPriceUsd)})
            </span>
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:flex md:items-center md:space-x-4">
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <ChartArea className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">24h Volume</p>
                <p className="text-xl font-bold">
                  {formatNumber(volume24hNative)} {nativeCurrency}
                  <span className="hidden text-[12px] text-muted-foreground xl:inline">
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
                  <span className="hidden text-[12px] text-muted-foreground xl:inline">
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
        <Tabs defaultValue={TABS[0]!.label} className="space-y-4">
          <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
            {TABS.map(({ label }) => (
              <TabsTrigger
                key={label}
                value={label}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
          {TABS.map(({ label, component }) => (
            <TabsContent key={label} value={label} className="space-y-4">
              {component}
            </TabsContent>
          ))}
        </Tabs>
      </Card>
      <GithubRepoLink />
      <div className="mt-8 h-[800px] w-full overflow-hidden rounded-[12px] border shadow-sm">
        <div className="origin-top-left scale-[0.8]">
          <iframe
            src="https://modularium.art/collection/mammoths"
            className="h-[1000px] w-[125%]"
            title="Modularium Collection Page"
          />
        </div>
      </div>
    </main>
  );
}
