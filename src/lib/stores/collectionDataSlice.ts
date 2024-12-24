import { StateCreator } from "zustand";

import { RootStore, CollectionDataSlice } from "./types";

/**
 * Store some collection data for ease of access
 */
export const createCollectionDataSlice: StateCreator<
  RootStore,
  [["zustand/subscribeWithSelector", never], ["zustand/devtools", never]],
  [],
  CollectionDataSlice
> = (set) => ({
  percentageChanges: {},
  setPercentageChanges(percentageChanges) {
    set({ percentageChanges });
  },
});
