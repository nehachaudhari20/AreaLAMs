import {
  pgTable,
  varchar,
  integer,
  boolean,
} from "drizzle-orm/pg-core";


export const adminUsers = pgTable("adminUsers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  isAdmin: boolean("isAdmin").notNull().default(false),
});
