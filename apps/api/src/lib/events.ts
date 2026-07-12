import { Redis } from "ioredis";
import { loadConfig } from "../config.ts";
import { logger } from "./logger.ts";

export type BoothEvent =
  | { type: "order.created"; orderId: string; kioskId: string | null }
  | { type: "order.updated"; orderId: string; kioskId: string | null }
  | {
      type: "payment.completed";
      paymentId: string;
      orderId: string;
      kioskId: string | null;
    }
  | {
      type: "payment.canceled";
      paymentId: string;
      orderId: string;
      kioskId: string | null;
    }
  | {
      type: "payment.expired";
      paymentId: string;
      orderId: string;
      kioskId: string | null;
    }
  | { type: "product.updated"; productId: string }
  | { type: "kiosk.presence"; kioskId: string; online: boolean }
  | { type: "kiosk.revoked"; kioskId: string };

type Handler = (event: BoothEvent) => void;

const CHANNEL_PREFIX = "booth:";

function channelFor(boothId: string): string {
  return `${CHANNEL_PREFIX}${boothId}`;
}

let publisher: Redis | null | undefined;
let subscriber: Redis | null | undefined;

const handlers = new Map<string, Set<Handler>>();

function redisUrl(): string {
  const url = loadConfig().REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL is required for the realtime event bus");
  }
  return url;
}

function getPublisher(): Redis {
  if (publisher === undefined || publisher === null) {
    publisher = new Redis(redisUrl(), { maxRetriesPerRequest: 2 });
  }
  return publisher;
}

function getSubscriber(): Redis {
  if (subscriber === undefined || subscriber === null) {
    const client = new Redis(redisUrl());
    client.on("message", (channel, payload) => {
      const set = handlers.get(channel);
      if (!set || set.size === 0) {
        return;
      }
      let event: BoothEvent;
      try {
        event = JSON.parse(payload) as BoothEvent;
      } catch {
        return;
      }
      for (const handler of set) {
        try {
          handler(event);
        } catch (err) {
          logger.error({ err }, "booth event handler failed");
        }
      }
    });
    subscriber = client;
  }
  return subscriber;
}

export async function publishBoothEvent(
  boothId: string,
  event: BoothEvent,
): Promise<void> {
  try {
    await getPublisher().publish(channelFor(boothId), JSON.stringify(event));
  } catch (err) {
    logger.error({ err }, "failed to publish booth event");
  }
}

export function subscribeBoothEvents(
  boothId: string,
  handler: Handler,
): () => void {
  const channel = channelFor(boothId);
  let set = handlers.get(channel);
  if (!set) {
    set = new Set();
    handlers.set(channel, set);
    getSubscriber()
      .subscribe(channel)
      .catch((err) => {
        logger.error({ err }, "failed to subscribe to booth channel");
        const current = handlers.get(channel);
        if (current && current.size === 0) {
          handlers.delete(channel);
        }
      });
  }
  set.add(handler);

  return () => {
    const current = handlers.get(channel);
    if (!current) {
      return;
    }
    current.delete(handler);
    if (current.size === 0) {
      handlers.delete(channel);
      getSubscriber()
        .unsubscribe(channel)
        .catch((err) => {
          logger.error({ err }, "failed to unsubscribe from booth channel");
        });
    }
  };
}

export async function closeEvents(): Promise<void> {
  handlers.clear();
  if (publisher) {
    await publisher.quit();
  }
  if (subscriber) {
    await subscriber.quit();
  }
  publisher = undefined;
  subscriber = undefined;
}
