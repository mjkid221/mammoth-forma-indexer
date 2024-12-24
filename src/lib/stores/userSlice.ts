import { StateCreator } from "zustand";

import { PersistingRootStore, UserSlice } from "./types";

/**
 * Store the user's configuration
 */
export const createUserSlice: StateCreator<
  PersistingRootStore,
  [["zustand/subscribeWithSelector", never], ["zustand/devtools", never]],
  [],
  UserSlice
> = (set, get) => ({
  configuration: {},
  setConfiguration(configuration) {
    set({ configuration: { ...get().configuration, ...configuration } });
  },
});
