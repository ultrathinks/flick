import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { request } from "@/shared/api";
import { type Booth, boothSchema } from "../model/types.ts";

const boothListSchema = z.array(boothSchema);

export function useBooths() {
  return useQuery<Booth[]>({
    queryKey: ["booths"],
    queryFn: () => request(boothListSchema, "booths"),
  });
}
