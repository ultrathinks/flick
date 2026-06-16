import { relations } from "drizzle-orm";
import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { sessions } from "./sessions.ts";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  dauthPublicId: text("dauth_public_id").notNull().unique(),
  username: text("username").notNull(),
  name: text("name").notNull(),
  profileImageUrl: text("profile_image_url"),
  roles: text("roles").array().notNull(),
  grade: integer("grade"),
  room: integer("room"),
  number: integer("number"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
