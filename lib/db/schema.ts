import type { InferSelectModel } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  json,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const user = pgTable("User", {
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  email: varchar("email", { length: 64 }).notNull(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  image: text("image"),
  isAnonymous: boolean("isAnonymous").notNull().default(false),
  name: text("name"),
  password: varchar("password", { length: 64 }),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type User = InferSelectModel<typeof user>;

export const userRuntimeConfig = pgTable("UserRuntimeConfig", {
  authTag: text("authTag").notNull(),
  baseUrl: text("baseUrl").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  defaultModelId: text("defaultModelId"),
  enabledModelIds: json("enabledModelIds").$type<string[]>(),
  encryptedApiKey: text("encryptedApiKey").notNull(),
  iv: text("iv").notNull(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  userId: uuid("userId")
    .primaryKey()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export type UserRuntimeConfig = InferSelectModel<typeof userRuntimeConfig>;

export const chat = pgTable("Chat", {
  createdAt: timestamp("createdAt").notNull(),
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  title: text("title").notNull(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  visibility: varchar("visibility", { enum: ["public", "private"] })
    .notNull()
    .default("private"),
});

export type Chat = InferSelectModel<typeof chat>;

export const message = pgTable("Message_v2", {
  attachments: json("attachments").notNull(),
  chatId: uuid("chatId")
    .notNull()
    .references(() => chat.id),
  createdAt: timestamp("createdAt").notNull(),
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  parts: json("parts").notNull(),
  role: varchar("role").notNull(),
});

export type DBMessage = InferSelectModel<typeof message>;

export const vote = pgTable(
  "Vote_v2",
  {
    chatId: uuid("chatId")
      .notNull()
      .references(() => chat.id),
    isUpvoted: boolean("isUpvoted").notNull(),
    messageId: uuid("messageId")
      .notNull()
      .references(() => message.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.chatId, table.messageId] }),
  })
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  "Document",
  {
    content: text("content"),
    createdAt: timestamp("createdAt").notNull(),
    id: uuid("id").notNull().defaultRandom(),
    kind: varchar("text", { enum: ["text", "code", "image", "sheet"] })
      .notNull()
      .default("text"),
    title: text("title").notNull(),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id, table.createdAt] }),
  })
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  "Suggestion",
  {
    createdAt: timestamp("createdAt").notNull(),
    description: text("description"),
    documentCreatedAt: timestamp("documentCreatedAt").notNull(),
    documentId: uuid("documentId").notNull(),
    id: uuid("id").notNull().defaultRandom(),
    isResolved: boolean("isResolved").notNull().default(false),
    originalText: text("originalText").notNull(),
    suggestedText: text("suggestedText").notNull(),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
  },
  (table) => ({
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
    pk: primaryKey({ columns: [table.id] }),
  })
);

export type Suggestion = InferSelectModel<typeof suggestion>;

export const stream = pgTable(
  "Stream",
  {
    chatId: uuid("chatId").notNull(),
    createdAt: timestamp("createdAt").notNull(),
    id: uuid("id").notNull().defaultRandom(),
  },
  (table) => ({
    chatRef: foreignKey({
      columns: [table.chatId],
      foreignColumns: [chat.id],
    }),
    pk: primaryKey({ columns: [table.id] }),
  })
);

export type Stream = InferSelectModel<typeof stream>;

export const character = pgTable("Character", {
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  description: text("description").notNull().default(""),
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: text("name").notNull(),
  prompt: text("prompt").notNull(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  visibility: varchar("visibility", { enum: ["private", "public"] })
    .notNull()
    .default("private"),
});

export type Character = InferSelectModel<typeof character>;

export const studioAsset = pgTable("StudioAsset", {
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  error: text("error"),
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  kind: varchar("kind", {
    enum: ["audio", "image", "project", "video"],
  }).notNull(),
  metadata: json("metadata"),
  mimeType: text("mimeType"),
  model: text("model"),
  outputUrl: text("outputUrl"),
  prompt: text("prompt"),
  providerJobId: text("providerJobId"),
  status: varchar("status", {
    enum: ["completed", "failed", "processing", "queued"],
  }).notNull(),
  title: text("title").notNull(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
});

export type StudioAsset = InferSelectModel<typeof studioAsset>;

export const feedPost = pgTable("FeedPost", {
  authorName: text("authorName"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  kind: varchar("kind", { enum: ["audio", "image", "video"] }).notNull(),
  mediaUrl: text("mediaUrl").notNull(),
  title: text("title").notNull(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  visibility: varchar("visibility", { enum: ["private", "public"] })
    .notNull()
    .default("public"),
});

export type FeedPost = InferSelectModel<typeof feedPost>;

export const feedReaction = pgTable(
  "FeedReaction",
  {
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    kind: varchar("kind", { enum: ["like", "save"] }).notNull(),
    postId: uuid("postId")
      .notNull()
      .references(() => feedPost.id),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.postId, table.userId, table.kind] }),
  })
);

export type FeedReaction = InferSelectModel<typeof feedReaction>;
