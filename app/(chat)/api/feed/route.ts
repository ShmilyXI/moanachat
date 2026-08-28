import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  createFeedPost,
  deleteFeedPost,
  getFeedPostById,
  getFeedReactionCounts,
  getFeedReactionsByUserId,
  getPublicFeedPosts,
  getStudioAssetById,
} from "@/lib/db/queries";

const postSchema = z.object({
  assetId: z.uuid().optional(),
  kind: z.enum(["audio", "image", "video"]).optional(),
  mediaUrl: z.url().or(z.string().startsWith("data:")).optional(),
  title: z.string().trim().min(1).max(200),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const kindValue = new URL(request.url).searchParams.get("kind");
  const kind = ["audio", "image", "video"].includes(kindValue ?? "")
    ? (kindValue as "audio" | "image" | "video")
    : undefined;
  const posts = await getPublicFeedPosts({ kind });
  const postIds = posts.map((post) => post.id);
  const [reactions, counts] = await Promise.all([
    getFeedReactionsByUserId({ postIds, userId: session.user.id }),
    getFeedReactionCounts({ postIds }),
  ]);
  const countMap = new Map<string, { like: number; save: number }>();
  for (const countRow of counts) {
    const current = countMap.get(countRow.postId) ?? { like: 0, save: 0 };
    if (countRow.kind === "like" || countRow.kind === "save") {
      current[countRow.kind] = Number(countRow.count);
    }
    countMap.set(countRow.postId, current);
  }
  const activeReactions = new Set(
    reactions.map((reaction) => `${reaction.postId}:${reaction.kind}`)
  );

  return NextResponse.json(
    posts.map((post) => ({
      ...post,
      author: post.authorName ?? "Moana creator",
      liked: activeReactions.has(`${post.id}:like`),
      likes: countMap.get(post.id)?.like ?? 0,
      saved: activeReactions.has(`${post.id}:save`),
      saves: countMap.get(post.id)?.save ?? 0,
    }))
  );
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = postSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid feed post" }, { status: 400 });
  }
  const {
    assetId,
    kind: requestedKind,
    mediaUrl: requestedMediaUrl,
    title,
  } = parsed.data;
  let mediaUrl = requestedMediaUrl;
  let kind = requestedKind;
  if (assetId) {
    const asset = await getStudioAssetById({
      id: assetId,
      userId: session.user.id,
    });
    if (!asset?.outputUrl || asset.status !== "completed") {
      return NextResponse.json(
        { error: "Only completed assets can be published" },
        { status: 400 }
      );
    }
    mediaUrl = asset.outputUrl;
    kind = asset.kind === "project" ? "image" : asset.kind;
  }
  if (!mediaUrl || !kind) {
    return NextResponse.json(
      { error: "assetId or mediaUrl and kind are required" },
      { status: 400 }
    );
  }

  const post = await createFeedPost({
    authorName: session.user.name ?? session.user.email ?? "Moana creator",
    kind,
    mediaUrl,
    title,
    userId: session.user.id,
  });
  return NextResponse.json(post, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  const post = await getFeedPostById({ id });
  if (!post || post.userId !== session.user.id) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
  await deleteFeedPost({ id, userId: session.user.id });
  return NextResponse.json({ success: true });
}
