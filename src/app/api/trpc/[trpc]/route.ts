import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { type NextResponse, type NextRequest } from "next/server";

import { env } from "~/env";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a HTTP request (e.g. when you make requests from Client Components).
 */
const createContext = async (req: NextRequest, res: NextResponse) => {
  return createTRPCContext({
    headers: req.headers,
    res,
  });
};

const handler = (req: NextRequest, res: NextResponse) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext(req, res),
    responseMeta: (opts) => {
      const { ctx, type, errors } = opts;
      // checking that no procedures errored
      const allOk = errors.length === 0;
      // checking we're doing a query request
      const isQuery = type === "query";
      if (ctx?.res && allOk && isQuery) {
        return {
          headers: new Headers([
            [
              "cache-control",
              `public, max-age=300, stale-while-revalidate=300}`,
            ],
          ]),
        };
      }

      return {};
    },
    onError:
      env.NODE_ENV === "development"
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`,
            );
          }
        : undefined,
  });

export { handler as GET, handler as POST };
