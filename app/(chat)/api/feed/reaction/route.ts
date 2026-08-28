import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { getFeedPostById, toggleFeedReaction } from "@/lib/db/queries";

const reactionSchema = z.object({
  active: z.boolean(),
  kind: z.enum(["like", "save"]),
  postId: z.uuid(),
});

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = reactionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid reaction" }, { status: 400 });
  }
  const post = await getFeedPostById({ id: parsed.data.postId });
  if (post?.visibility !== "public") {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
  await toggleFeedReaction({ ...parsed.data, userId: session.user.id });
  return NextResponse.json({ success: true });
}
