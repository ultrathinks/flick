import { getDb } from "../db/index.ts";
import { type NewUser, type User, users } from "../db/schema/index.ts";

export async function upsertByDauthId(user: NewUser): Promise<User> {
  const [row] = await getDb()
    .insert(users)
    .values(user)
    .onConflictDoUpdate({
      target: users.dauthPublicId,
      set: {
        username: user.username,
        name: user.name,
        profileImageUrl: user.profileImageUrl,
        roles: user.roles,
        grade: user.grade,
        room: user.room,
        number: user.number,
        updatedAt: new Date(),
      },
    })
    .returning();

  if (!row) {
    throw new Error("failed to upsert user");
  }

  return row;
}

export function toPublicUser(user: User) {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    profileImageUrl: user.profileImageUrl,
    roles: user.roles,
    grade: user.grade,
    room: user.room,
    number: user.number,
  };
}
