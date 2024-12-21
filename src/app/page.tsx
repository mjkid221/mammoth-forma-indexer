import { Activity, TrendingUp, Volume2 } from "lucide-react";
import { Card } from "~/components/ui/card";
import { TradingViewChart } from "./_components/TradingViewChart";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@radix-ui/react-tabs";
import { api } from "~/trpc/server";

// Mock data - replace with real API data
const mockPriceData = Array.from({ length: 100 }, (_, i) => ({
  time: new Date(Date.now() - (100 - i) * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0]!,
  value: Math.random() * 100 + 50,
}));

export default function Home() {
  return (
    <main className="container mx-auto space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Bored Ape Yacht Club</h1>
          <p className="text-muted-foreground">Floor Price: 50.5 ETH</p>
        </div>
        <div className="flex items-center space-x-4">
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">24h Volume</p>
                <p className="text-xl font-bold">1,234 ETH</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">24h Sales</p>
                <p className="text-xl font-bold">45</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Market Cap</p>
                <p className="text-xl font-bold">505K ETH</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Card className="p-6">
        <Tabs defaultValue="price" className="space-y-4">
          <TabsList>
            <TabsTrigger value="price">Price</TabsTrigger>
            <TabsTrigger value="volume">Volume</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
          </TabsList>
          <TabsContent value="price" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Price Chart</h2>
                <p className="text-muted-foreground">Floor price over time</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-green-500">+2.5%</span>
                <span className="text-muted-foreground">24h</span>
              </div>
            </div>
            <TradingViewChart data={mockPriceData} />
          </TabsContent>
          <TabsContent value="volume">
            <TradingViewChart data={mockPriceData} />
          </TabsContent>
          <TabsContent value="sales">
            <TradingViewChart data={mockPriceData} />
          </TabsContent>
        </Tabs>
      </Card>
    </main>
  );
}
