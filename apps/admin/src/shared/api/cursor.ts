import { type QueryKey, useInfiniteQuery } from "@tanstack/react-query";
import { z } from "zod";
import { request } from "./request.ts";

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

export function useCursorQuery<T>(params: {
  queryKey: QueryKey;
  path: string;
  itemSchema: z.ZodType<T>;
  searchParams?: Record<string, string | undefined>;
  enabled?: boolean;
}) {
  const { queryKey, path, itemSchema, searchParams, enabled } = params;
  const schema = z.object({
    items: z.array(itemSchema),
    nextCursor: z.string().nullable(),
  });
  return useInfiniteQuery({
    queryKey,
    enabled,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => {
      const search = new URLSearchParams();
      for (const [key, value] of Object.entries(searchParams ?? {})) {
        if (value) {
          search.set(key, value);
        }
      }
      if (pageParam) {
        search.set("cursor", pageParam);
      }
      const query = search.toString();
      return request(schema, query ? `${path}?${query}` : path);
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}
