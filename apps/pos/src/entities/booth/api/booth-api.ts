import { ApiError, request } from "@/shared/api";
import { type Booth, boothSchema } from "../model/types.ts";

export async function fetchMyBooth(): Promise<Booth | null> {
  try {
    return await request(boothSchema, "users/me/booth");
  } catch (error) {
    if (error instanceof ApiError && error.code === "NOT_FOUND") {
      return null;
    }
    throw error;
  }
}

export interface BoothInput {
  name: string;
  description?: string;
}

export function createBooth(input: BoothInput): Promise<Booth> {
  return request(boothSchema, "users/me/booth", {
    method: "post",
    json: input,
  });
}

export function updateBooth(input: Partial<BoothInput>): Promise<Booth> {
  return request(boothSchema, "users/me/booth", {
    method: "patch",
    json: input,
  });
}
