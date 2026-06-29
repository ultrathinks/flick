import { z } from "zod";
import { request } from "@/shared/api";
import { type Booth, boothSchema } from "../model/types.ts";

export function fetchBooths(): Promise<Booth[]> {
  return request(z.array(boothSchema), "booths");
}

export interface BoothInput {
  name: string;
  description?: string;
  imageUrl?: string;
}

export function createBooth(input: BoothInput): Promise<Booth> {
  return request(boothSchema, "booths", { method: "post", json: input });
}

export function updateBooth(
  id: string,
  input: Partial<BoothInput>,
): Promise<Booth> {
  return request(boothSchema, `booths/${id}`, {
    method: "patch",
    json: input,
  });
}
