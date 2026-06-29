"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchBoothOrders } from "../api/order-api.ts";

export function useBoothOrders(boothId: string) {
  return useQuery({
    queryKey: ["orders", boothId],
    queryFn: () => fetchBoothOrders(boothId),
  });
}
