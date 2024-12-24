/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  headers: async () => {
    return [
      {
        source: "/api/trpc/collectionData.getLatest",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=300, stale-while-revalidate=300",
          },
        ],
      },
      {
        source: "/api/trpc/collectionData.getCollectionData",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=300, stale-while-revalidate=300",
          },
        ],
      },
    ];
  },
};

export default config;
