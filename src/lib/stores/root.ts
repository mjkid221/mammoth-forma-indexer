import { create } from "zustand";
import {
  createJSONStorage,
  devtools,
  persist,
  subscribeWithSelector,
} from "zustand/middleware";

import { createUserSlice } from "./userSlice";
import { createCollectionDataSlice } from "./collectionDataSlice";
import { PersistingRootStore, RootStore } from "./types";

export const useRootStore = create<RootStore>()(
  subscribeWithSelector(
    devtools((...args) => ({
      ...createCollectionDataSlice(...args),
    })),
  ),
);

export const usePersistingRootStore = create<PersistingRootStore>()(
  persist(
    subscribeWithSelector(
      devtools((...args) => ({
        ...createUserSlice(...args),
      })),
    ),
    {
      name: "persisting-root-store",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
