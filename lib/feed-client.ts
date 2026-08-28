export type FeedItem = {
  id: string;
  mediaUrl: string;
  title: string;
  author: string;
  kind: "audio" | "image" | "video";
  liked: boolean;
  likes: number;
  saved: boolean;
  saves: number;
};

export async function fetchFeed(kind?: FeedItem["kind"]): Promise<FeedItem[]> {
  const query = kind ? `?kind=${encodeURIComponent(kind)}` : "";
  const response = await fetch(`/api/feed${query}`);
  if (!response.ok) {
    throw new Error("Unable to load Feed");
  }
  return (await response.json()) as FeedItem[];
}

export async function setFeedReaction({
  active,
  kind,
  postId,
}: {
  active: boolean;
  kind: "like" | "save";
  postId: string;
}) {
  const response = await fetch("/api/feed/reaction", {
    body: JSON.stringify({ active, kind, postId }),
    headers: { "Content-Type": "application/json" },
    method: "PATCH",
  });
  if (!response.ok) {
    const payload = (await response.json()) as { error?: string };
    throw new Error(payload.error || "Unable to update reaction");
  }
}
