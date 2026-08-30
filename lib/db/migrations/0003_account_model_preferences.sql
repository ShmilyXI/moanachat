ALTER TABLE "UserRuntimeConfig" ADD COLUMN "defaultModelId" text;--> statement-breakpoint
ALTER TABLE "UserRuntimeConfig" ADD COLUMN "enabledModelIds" json;