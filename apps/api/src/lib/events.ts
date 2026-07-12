import { randomUUID } from "node:crypto";
import type {
  AdminEvent,
  BoothEvent,
  ChannelEvent,
  UserEvent,
} from "@flick/contract";
import { Redis } from "ioredis";
import { loadConfig } from "../config.ts";
import { logger } from "./logger.ts";

type EventInput<E> = E extends { type: infer T; data: infer D }
  ? { type: T; data: D }
  : never;

export type BoothEventInput = EventInput<BoothEvent>;
export type UserEventInput = EventInput<UserEvent>;
export type AdminEventInput = EventInput<AdminEvent>;

type Handler = (event: ChannelEvent) => void;

const BOOTH_PREFIX = "booth:";
const USER_PREFIX = "user:";
const ADMIN_CHANNEL = "admin";

function boothChannel(boothId: string): string {
  return `${BOOTH_PREFIX}${boothId}`;
}

function userChannel(userId: string): string {
  return `${USER_PREFIX}${userId}`;
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
      let event: ChannelEvent;
      try {
        event = JSON.parse(payload) as ChannelEvent;
      } catch {
        return;
      }
      for (const handler of set) {
        try {
          handler(event);
        } catch (err) {
          logger.error({ err }, "channel event handler failed");
        }
      }
    });
    subscriber = client;
  }
  return subscriber;
}

async function publish(
  channel: string,
  input: { type: string; data: unknown },
): Promise<void> {
  const event = {
    v: 1 as const,
    id: randomUUID(),
    ts: new Date().toISOString(),
    type: input.type,
    data: input.data,
  };
  try {
    await getPublisher().publish(channel, JSON.stringify(event));
  } catch (err) {
    logger.error({ err, channel }, "failed to publish event");
  }
}

function subscribe<E extends ChannelEvent>(
  channel: string,
  handler: (event: E) => void,
): () => void {
  const typedHandler = handler as Handler;
  let set = handlers.get(channel);
  if (!set) {
    set = new Set();
    handlers.set(channel, set);
    getSubscriber()
      .subscribe(channel)
      .catch((err) => {
        logger.error({ err, channel }, "failed to subscribe to channel");
        const current = handlers.get(channel);
        if (current && current.size === 0) {
          handlers.delete(channel);
        }
      });
  }
  set.add(typedHandler);

  return () => {
    const current = handlers.get(channel);
    if (!current) {
      return;
    }
    current.delete(typedHandler);
    if (current.size === 0) {
      handlers.delete(channel);
      getSubscriber()
        .unsubscribe(channel)
        .catch((err) => {
          logger.error({ err, channel }, "failed to unsubscribe from channel");
        });
    }
  };
}

export function publishBoothEvent(
  boothId: string,
  input: BoothEventInput,
): Promise<void> {
  return publish(boothChannel(boothId), input);
}

export function publishUserEvent(
  userId: string,
  input: UserEventInput,
): Promise<void> {
  return publish(userChannel(userId), input);
}

export function publishAdminEvent(input: AdminEventInput): Promise<void> {
  return publish(ADMIN_CHANNEL, input);
}

export function subscribeBoothEvents(
  boothId: string,
  handler: (event: BoothEvent) => void,
): () => void {
  return subscribe(boothChannel(boothId), handler);
}

export function subscribeUserEvents(
  userId: string,
  handler: (event: UserEvent) => void,
): () => void {
  return subscribe(userChannel(userId), handler);
}

export function subscribeAdminEvents(
  handler: (event: AdminEvent) => void,
): () => void {
  return subscribe(ADMIN_CHANNEL, handler);
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
