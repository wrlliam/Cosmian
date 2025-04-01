import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const modRecommendations = sqliteTable("mod_recommendations", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text(),
  authorId: text(),
  link: text(),
  thoughts: text(),
  forumId: text(),
});
