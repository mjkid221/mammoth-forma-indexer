import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
    NEXT_PUBLIC_PROJECT_NAME: z.string(),
    NEXT_PUBLIC_COLLECTION_ADDRESS: z.string(),
    NEXT_PUBLIC_COLLECTION_MAX_SUPPLY: z.coerce.number(),
    NEXT_PUBLIC_NATIVE_CURRENCY: z.string(),
    NEXT_PUBLIC_CREATOR_GITHUB_URL: z.string().url().optional(),
    NEXT_PUBLIC_CREATOR_TWITTER_URL: z.string().url().optional(),
    NEXT_PUBLIC_CREATOR_NAME: z.string().optional(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_PROJECT_NAME: process.env.NEXT_PUBLIC_PROJECT_NAME,
    NEXT_PUBLIC_COLLECTION_ADDRESS: process.env.NEXT_PUBLIC_COLLECTION_ADDRESS,
    NEXT_PUBLIC_COLLECTION_MAX_SUPPLY:
      process.env.NEXT_PUBLIC_COLLECTION_MAX_SUPPLY,
    NEXT_PUBLIC_NATIVE_CURRENCY: process.env.NEXT_PUBLIC_NATIVE_CURRENCY,
    NEXT_PUBLIC_CREATOR_GITHUB_URL: process.env.NEXT_PUBLIC_CREATOR_GITHUB_URL,
    NEXT_PUBLIC_CREATOR_TWITTER_URL:
      process.env.NEXT_PUBLIC_CREATOR_TWITTER_URL,
    NEXT_PUBLIC_CREATOR_NAME: process.env.NEXT_PUBLIC_CREATOR_NAME,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
