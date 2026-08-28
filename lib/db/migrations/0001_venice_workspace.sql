CREATE TABLE IF NOT EXISTS "Character" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" uuid NOT NULL REFERENCES "User"("id"),
  "name" text NOT NULL,
  "description" text NOT NULL DEFAULT '',
  "prompt" text NOT NULL,
  "visibility" varchar NOT NULL DEFAULT 'private',
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "StudioAsset" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" uuid NOT NULL REFERENCES "User"("id"),
  "kind" varchar NOT NULL,
  "status" varchar NOT NULL,
  "title" text NOT NULL,
  "prompt" text,
  "model" text,
  "providerJobId" text,
  "outputUrl" text,
  "mimeType" text,
  "error" text,
  "metadata" json,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "FeedPost" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" uuid NOT NULL REFERENCES "User"("id"),
  "kind" varchar NOT NULL,
  "title" text NOT NULL,
  "mediaUrl" text NOT NULL,
  "authorName" text,
  "visibility" varchar NOT NULL DEFAULT 'public',
  "createdAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "FeedReaction" (
  "postId" uuid NOT NULL REFERENCES "FeedPost"("id"),
  "userId" uuid NOT NULL REFERENCES "User"("id"),
  "kind" varchar NOT NULL,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("postId", "userId", "kind")
);
