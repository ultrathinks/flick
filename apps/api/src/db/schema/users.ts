import { relations } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { sessions } from "./sessions.ts";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    dauthPublicId: text("dauth_public_id").notNull().unique(),
    username: text("username").notNull(),
    name: text("name").notNull(),
    profileImageUrl: text("profile_image_url"),
    roles: text("roles").array().notNull(),
    isAdmin: boolean("is_admin").notNull().default(false),
    studentNumber: text("student_number"),
    balance: bigint("balance", { mode: "number" }).notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("users_created_at_id_idx").on(
      table.createdAt.desc(),
      table.id.desc(),
    ),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
