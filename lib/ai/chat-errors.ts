import { getAIProviderErrorMessage } from "@/lib/errors";

export function getChatStreamErrorMessage(error: unknown): string {
  return getAIProviderErrorMessage(error) ?? "An error occurred.";
}
