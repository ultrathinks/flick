import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

const sessionStatusSchema = z.object({ authenticated: z.boolean() });

async function fetchSessionStatus(): Promise<boolean> {
  const res = await fetch("/api/auth/session");
  const data = sessionStatusSchema.parse(await res.json());
  return data.authenticated;
}

export function useSessionStatus() {
  return useQuery({
    queryKey: ["session"],
    queryFn: fetchSessionStatus,
  });
}
