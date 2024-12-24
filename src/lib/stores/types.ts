import { MetricChanges } from "~/server/api/routers/types";

export type RootStore = CollectionDataSlice;
export type PersistingRootStore = UserSlice;

// Persisting stores
export type UserSlice = {
  configuration: Record<string, string | boolean | number>;
  setConfiguration: (
    configuration: Record<string, string | boolean | number>,
  ) => void;
};

// Non-persisting stores
export type CollectionDataSlice = {
  /** @deprecated */
  percentageChanges: Record<string, MetricChanges>;
  setPercentageChanges: (
    percentageChanges: Record<string, MetricChanges>,
  ) => void;
};
