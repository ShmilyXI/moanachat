import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  lt,
  type SQL,
} from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { ArtifactKind } from "@/components/chat/artifact";
import type { VisibilityType } from "@/components/chat/visibility-selector";
import { ChatbotError } from "../errors";
import { generateUUID } from "../utils";
import {
  type Chat,
  character,
  chat,
  type DBMessage,
  document,
  feedPost,
  feedReaction,
  message,
  type Suggestion,
  stream,
  studioAsset,
  suggestion,
  type User,
  user,
  userRuntimeConfig,
  vote,
} from "./schema";
import { generateHashedPassword } from "./utils";

const client = postgres(process.env.POSTGRES_URL ?? "");
const db = drizzle(client);

export async function getUser(email: string): Promise<User[]> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function createUser(email: string, password: string) {
  const hashedPassword = generateHashedPassword(password);

  try {
    return await db.insert(user).values({ email, password: hashedPassword });
  } catch (error) {
    throw new ChatbotError("bad_request:database", {
      cause: error,
    });
  }
}

export async function createGuestUser() {
  const email = `guest-${Date.now()}`;
  const password = generateHashedPassword(generateUUID());

  try {
    return await db.insert(user).values({ email, password }).returning({
      email: user.email,
      id: user.id,
    });
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getUserRuntimeConfigByUserId({
  userId,
}: {
  userId: string;
}) {
  try {
    const [result] = await db
      .select()
      .from(userRuntimeConfig)
      .where(eq(userRuntimeConfig.userId, userId))
      .limit(1);
    return result ?? null;
  } catch (cause) {
    throw new ChatbotError("bad_request:database", { cause });
  }
}

export async function upsertUserRuntimeConfig({
  authTag,
  baseUrl,
  ciphertext,
  iv,
  userId,
}: {
  authTag: string;
  baseUrl: string;
  ciphertext: string;
  iv: string;
  userId: string;
}) {
  try {
    const [result] = await db
      .insert(userRuntimeConfig)
      .values({
        authTag,
        baseUrl,
        encryptedApiKey: ciphertext,
        iv,
        userId,
      })
      .onConflictDoUpdate({
        set: {
          authTag,
          baseUrl,
          defaultModelId: null,
          enabledModelIds: null,
          encryptedApiKey: ciphertext,
          iv,
          updatedAt: new Date(),
        },
        target: userRuntimeConfig.userId,
      })
      .returning();
    return result;
  } catch (cause) {
    throw new ChatbotError("bad_request:database", { cause });
  }
}

export async function updateUserRuntimeModelPreferences({
  defaultModelId,
  enabledModelIds,
  userId,
}: {
  defaultModelId: string;
  enabledModelIds: string[];
  userId: string;
}) {
  try {
    const [result] = await db
      .update(userRuntimeConfig)
      .set({
        defaultModelId,
        enabledModelIds,
        updatedAt: new Date(),
      })
      .where(eq(userRuntimeConfig.userId, userId))
      .returning();
    return result ?? null;
  } catch (cause) {
    throw new ChatbotError("bad_request:database", { cause });
  }
}

export async function deleteUserRuntimeConfig({ userId }: { userId: string }) {
  try {
    await db
      .delete(userRuntimeConfig)
      .where(eq(userRuntimeConfig.userId, userId));
  } catch (cause) {
    throw new ChatbotError("bad_request:database", { cause });
  }
}

export async function saveChat({
  id,
  userId,
  title,
  visibility,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
}) {
  try {
    return await db.insert(chat).values({
      createdAt: new Date(),
      id,
      title,
      userId,
      visibility,
    });
  } catch (error) {
    throw new ChatbotError("bad_request:database", {
      cause: error,
    });
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));
    await db.delete(stream).where(eq(stream.chatId, id));

    const [chatsDeleted] = await db
      .delete(chat)
      .where(eq(chat.id, id))
      .returning();
    return chatsDeleted;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function deleteAllChatsByUserId({ userId }: { userId: string }) {
  try {
    const userChats = await db
      .select({ id: chat.id })
      .from(chat)
      .where(eq(chat.userId, userId));

    if (userChats.length === 0) {
      return { deletedCount: 0 };
    }

    const chatIds = userChats.map((c) => c.id);

    await db.delete(vote).where(inArray(vote.chatId, chatIds));
    await db.delete(message).where(inArray(message.chatId, chatIds));
    await db.delete(stream).where(inArray(stream.chatId, chatIds));

    const deletedChats = await db
      .delete(chat)
      .where(eq(chat.userId, userId))
      .returning();

    return { deletedCount: deletedChats.length };
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  try {
    const extendedLimit = limit + 1;

    const query = (whereCondition?: SQL<unknown>) =>
      db
        .select()
        .from(chat)
        .where(
          whereCondition
            ? and(whereCondition, eq(chat.userId, id))
            : eq(chat.userId, id)
        )
        .orderBy(desc(chat.createdAt))
        .limit(extendedLimit);

    let filteredChats: Chat[] = [];

    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, startingAfter))
        .limit(1);

      if (!selectedChat) {
        throw new ChatbotError(
          "not_found:database",
          `Chat with id ${startingAfter} not found`
        );
      }

      filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt));
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, endingBefore))
        .limit(1);

      if (!selectedChat) {
        throw new ChatbotError(
          "not_found:database",
          `Chat with id ${endingBefore} not found`
        );
      }

      filteredChats = await query(lt(chat.createdAt, selectedChat.createdAt));
    } else {
      filteredChats = await query();
    }

    const hasMore = filteredChats.length > limit;

    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    if (!selectedChat) {
      return null;
    }

    return selectedChat;
  } catch (error) {
    throw new ChatbotError("bad_request:database", {
      cause: error,
    });
  }
}

export async function saveMessages({ messages }: { messages: DBMessage[] }) {
  try {
    return await db.insert(message).values(messages);
  } catch (error) {
    throw new ChatbotError("bad_request:database", {
      cause: error,
    });
  }
}

export async function updateMessage({
  id,
  parts,
}: {
  id: string;
  parts: DBMessage["parts"];
}) {
  try {
    return await db.update(message).set({ parts }).where(eq(message.id, id));
  } catch (error) {
    throw new ChatbotError("bad_request:database", {
      cause: error,
    });
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: "up" | "down";
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === "up" })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      isUpvoted: type === "up",
      messageId,
    });
  } catch (error) {
    throw new ChatbotError("bad_request:database", {
      cause: error,
    });
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    return await db
      .insert(document)
      .values({
        content,
        createdAt: new Date(),
        id,
        kind,
        title,
        userId,
      })
      .returning();
  } catch (error) {
    throw new ChatbotError("bad_request:database", {
      cause: error,
    });
  }
}

export async function updateDocumentContent({
  id,
  content,
}: {
  id: string;
  content: string;
}) {
  try {
    const docs = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt))
      .limit(1);

    const [latest] = docs;
    if (!latest) {
      throw new ChatbotError("not_found:database", "Document not found");
    }

    return await db
      .update(document)
      .set({ content })
      .where(and(eq(document.id, id), eq(document.createdAt, latest.createdAt)))
      .returning();
  } catch (error) {
    if (error instanceof ChatbotError) {
      throw error;
    }
    throw new ChatbotError("bad_request:database", {
      cause: error,
    });
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp)
        )
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
      .returning();
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Suggestion[];
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(eq(suggestion.documentId, documentId));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp))
      );

    const messageIds = messagesToDelete.map(
      (currentMessage) => currentMessage.id
    );

    if (messageIds.length > 0) {
      await db
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds))
        );

      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds))
        );
    }
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function updateChatVisibilityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: "private" | "public";
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function updateChatTitleById({
  chatId,
  title,
}: {
  chatId: string;
  title: string;
}) {
  try {
    return await db.update(chat).set({ title }).where(eq(chat.id, chatId));
  } catch {
    // Best effort title update.
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: {
  id: string;
  differenceInHours: number;
}) {
  try {
    const cutoffTime = new Date(
      Date.now() - differenceInHours * 60 * 60 * 1000
    );

    const [stats] = await db
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(
        and(
          eq(chat.userId, id),
          gte(message.createdAt, cutoffTime),
          eq(message.role, "user")
        )
      )
      .execute();

    return stats?.count ?? 0;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  try {
    await db
      .insert(stream)
      .values({ chatId, createdAt: new Date(), id: streamId });
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  try {
    const streamIds = await db
      .select({ id: stream.id })
      .from(stream)
      .where(eq(stream.chatId, chatId))
      .orderBy(asc(stream.createdAt))
      .execute();

    return streamIds.map(({ id }) => id);
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function createCharacter({
  description,
  id,
  name,
  prompt,
  userId,
  visibility = "private",
}: {
  description?: string;
  id?: string;
  name: string;
  prompt: string;
  userId: string;
  visibility?: "private" | "public";
}) {
  try {
    const [created] = await db
      .insert(character)
      .values({
        ...(id ? { id } : {}),
        description: description ?? "",
        name,
        prompt,
        userId,
        visibility,
      })
      .returning();
    return created;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getCharacterById({ id }: { id: string }) {
  try {
    const [result] = await db
      .select()
      .from(character)
      .where(eq(character.id, id));
    return result ?? null;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getCharactersByUserId({ userId }: { userId: string }) {
  try {
    return await db
      .select()
      .from(character)
      .where(eq(character.userId, userId))
      .orderBy(desc(character.updatedAt));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getPublicCharacters() {
  try {
    return await db
      .select()
      .from(character)
      .where(eq(character.visibility, "public"))
      .orderBy(desc(character.updatedAt));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function updateCharacter({
  description,
  id,
  name,
  prompt,
  userId,
  visibility,
}: {
  description?: string;
  id: string;
  name?: string;
  prompt?: string;
  userId: string;
  visibility?: "private" | "public";
}) {
  try {
    const [updated] = await db
      .update(character)
      .set({
        ...(description === undefined ? {} : { description }),
        ...(name === undefined ? {} : { name }),
        ...(prompt === undefined ? {} : { prompt }),
        ...(visibility === undefined ? {} : { visibility }),
        updatedAt: new Date(),
      })
      .where(and(eq(character.id, id), eq(character.userId, userId)))
      .returning();
    return updated ?? null;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function deleteCharacter({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  try {
    await db
      .delete(character)
      .where(and(eq(character.id, id), eq(character.userId, userId)));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function createStudioAsset({
  error,
  id,
  kind,
  metadata,
  mimeType,
  model,
  outputUrl,
  prompt,
  providerJobId,
  status,
  title,
  userId,
}: {
  error?: string;
  id?: string;
  kind: "audio" | "image" | "project" | "video";
  metadata?: Record<string, unknown>;
  mimeType?: string;
  model?: string;
  outputUrl?: string;
  prompt?: string;
  providerJobId?: string;
  status: "completed" | "failed" | "processing" | "queued";
  title: string;
  userId: string;
}) {
  try {
    const [created] = await db
      .insert(studioAsset)
      .values({
        ...(id ? { id } : {}),
        ...(error ? { error } : {}),
        ...(metadata ? { metadata } : {}),
        ...(mimeType ? { mimeType } : {}),
        ...(model ? { model } : {}),
        ...(outputUrl ? { outputUrl } : {}),
        ...(prompt ? { prompt } : {}),
        ...(providerJobId ? { providerJobId } : {}),
        kind,
        status,
        title,
        userId,
      })
      .returning();
    return created;
  } catch (cause) {
    throw new ChatbotError("bad_request:database", { cause });
  }
}

export async function getStudioAssetById({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  try {
    const [result] = await db
      .select()
      .from(studioAsset)
      .where(and(eq(studioAsset.id, id), eq(studioAsset.userId, userId)));
    return result ?? null;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getStudioAssetsByUserId({ userId }: { userId: string }) {
  try {
    return await db
      .select()
      .from(studioAsset)
      .where(eq(studioAsset.userId, userId))
      .orderBy(desc(studioAsset.updatedAt));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function updateStudioAsset({
  error,
  id,
  model,
  outputUrl,
  providerJobId,
  status,
  userId,
}: {
  error?: string | null;
  id: string;
  model?: string | null;
  outputUrl?: string | null;
  providerJobId?: string | null;
  status?: "completed" | "failed" | "processing" | "queued";
  userId: string;
}) {
  try {
    const [updated] = await db
      .update(studioAsset)
      .set({
        ...(error === undefined ? {} : { error }),
        ...(model === undefined ? {} : { model }),
        ...(outputUrl === undefined ? {} : { outputUrl }),
        ...(providerJobId === undefined ? {} : { providerJobId }),
        ...(status === undefined ? {} : { status }),
        updatedAt: new Date(),
      })
      .where(and(eq(studioAsset.id, id), eq(studioAsset.userId, userId)))
      .returning();
    return updated ?? null;
  } catch (cause) {
    throw new ChatbotError("bad_request:database", { cause });
  }
}

export async function deleteStudioAsset({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  try {
    await db
      .delete(studioAsset)
      .where(and(eq(studioAsset.id, id), eq(studioAsset.userId, userId)));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function createFeedPost({
  authorName,
  id,
  kind,
  mediaUrl,
  title,
  userId,
  visibility = "public",
}: {
  authorName?: string;
  id?: string;
  kind: "audio" | "image" | "video";
  mediaUrl: string;
  title: string;
  userId: string;
  visibility?: "private" | "public";
}) {
  try {
    const [created] = await db
      .insert(feedPost)
      .values({
        ...(authorName ? { authorName } : {}),
        ...(id ? { id } : {}),
        kind,
        mediaUrl,
        title,
        userId,
        visibility,
      })
      .returning();
    return created;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getPublicFeedPosts({
  kind,
}: {
  kind?: "audio" | "image" | "video";
} = {}) {
  try {
    const whereCondition = kind
      ? and(eq(feedPost.visibility, "public"), eq(feedPost.kind, kind))
      : eq(feedPost.visibility, "public");
    return await db
      .select()
      .from(feedPost)
      .where(whereCondition)
      .orderBy(desc(feedPost.createdAt));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getFeedPostById({ id }: { id: string }) {
  try {
    const [result] = await db
      .select()
      .from(feedPost)
      .where(eq(feedPost.id, id));
    return result ?? null;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function deleteFeedPost({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  try {
    await db.delete(feedReaction).where(eq(feedReaction.postId, id));
    await db
      .delete(feedPost)
      .where(and(eq(feedPost.id, id), eq(feedPost.userId, userId)));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getFeedReactionsByUserId({
  postIds,
  userId,
}: {
  postIds: string[];
  userId: string;
}) {
  if (postIds.length === 0) {
    return [];
  }
  try {
    return await db
      .select()
      .from(feedReaction)
      .where(
        and(
          eq(feedReaction.userId, userId),
          inArray(feedReaction.postId, postIds)
        )
      );
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getFeedReactionCounts({
  postIds,
}: {
  postIds: string[];
}) {
  if (postIds.length === 0) {
    return [];
  }
  try {
    return await db
      .select({
        count: count(feedReaction.postId),
        kind: feedReaction.kind,
        postId: feedReaction.postId,
      })
      .from(feedReaction)
      .where(inArray(feedReaction.postId, postIds))
      .groupBy(feedReaction.postId, feedReaction.kind);
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function toggleFeedReaction({
  active,
  kind,
  postId,
  userId,
}: {
  active: boolean;
  kind: "like" | "save";
  postId: string;
  userId: string;
}) {
  try {
    const whereCondition = and(
      eq(feedReaction.kind, kind),
      eq(feedReaction.postId, postId),
      eq(feedReaction.userId, userId)
    );
    if (active) {
      await db
        .insert(feedReaction)
        .values({ kind, postId, userId })
        .onConflictDoNothing();
      return;
    }
    await db.delete(feedReaction).where(whereCondition);
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}
