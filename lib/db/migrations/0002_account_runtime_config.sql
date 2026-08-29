CREATE TABLE IF NOT EXISTS "UserRuntimeConfig" (
	"authTag" text NOT NULL,
	"baseUrl" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"encryptedApiKey" text NOT NULL,
	"iv" text NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"userId" uuid PRIMARY KEY NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 IF NOT EXISTS (
  SELECT 1
  FROM pg_constraint
  WHERE conname = 'UserRuntimeConfig_userId_User_id_fk'
    AND conrelid = '"UserRuntimeConfig"'::regclass
 ) THEN
  ALTER TABLE "UserRuntimeConfig"
    ADD CONSTRAINT "UserRuntimeConfig_userId_User_id_fk"
    FOREIGN KEY ("userId") REFERENCES "public"."User"("id")
    ON DELETE cascade ON UPDATE no action;
 END IF;
END $$;
